import { printCorpses, printDrops } from '~/core/statusPrinter'
import i18n from '~/i18n'
import { MonsterFactory } from '../MonsterFactory'
import { Player } from '../player/Player'
import { Terminal } from '../Terminal'
import { World } from '../World'
import { BattleActionHandler } from './BattleActionHandler'
import { BattleComponentFactory } from './BattleComponentFactory'
import { BattleDirector } from './BattleDirector'
import { BattleEngine, BattleManager } from './BattleEngine'
import { BattleRewardSystem } from './BattleRewardSystem'
import { BattleTarget } from './BattleTarget'
import { BattleUnitManager } from './BattleUnitManager'
import { CombatService, DamageOptions } from './CombatService'
import { BattleResult } from './types'
import { CombatUnit } from './unit/CombatUnit'

export type { DamageOptions } from './CombatService'

export type CalcDamageOptions = DamageOptions
export type CalcDamageResult = ReturnType<typeof CombatService.calcDamage>

export interface DamageResult extends CalcDamageResult {
  currentHp: number
  isDead: boolean
}

export class Battle implements BattleManager {
  private units: BattleUnitManager
  private rewards: BattleRewardSystem
  private actions: BattleActionHandler
  private lastBattleResult: BattleResult | null = null

  constructor(
    private player: Player,
    private monster: MonsterFactory,
    private factory: BattleComponentFactory
  ) {
    this.units = this.factory.createUnits(this)
    this.rewards = this.factory.createRewards(this.units)
    this.actions = this.factory.createActions(this.units)
  }

  getAliveUnits(): CombatUnit[] {
    return this.units.getAliveUnits()
  }

  getTurnOrder(): CombatUnit[] {
    return this.getAliveUnits().sort((a, b) => {
      const agiA = a.stats?.agi ?? 0
      const agiB = b.stats?.agi ?? 0
      if (agiB !== agiA) return agiB - agiA
      const priority: Record<string, number> = { player: 3, minion: 2, monster: 1, npc: 1 }
      return (priority[b.type] ?? 0) - (priority[a.type] ?? 0)
    })
  }

  async handleUnitTurn(unit: CombatUnit): Promise<boolean | void> {
    Terminal.log(i18n.t('battle.turn_start', { name: unit.name }))
    unit.buffManager.updateDuration()

    if (await this.actions.handleUnitDeBuff(unit)) return

    const enemiesSide = this.units.getEnemiesOf(unit)
    const allySide = this.units.getAllysOf(unit)

    if (unit.type === 'player') {
      const isEscaped = await this.actions.handlePlayerAction(unit as CombatUnit<Player>, allySide)
      if (isEscaped) {
        this.lastBattleResult = { isVictory: false, isEscaped: true, gold: 0, exp: 0, drops: [] }
        return true
      }
    } else {
      const isConfused = unit.hasDeBuff({ type: 'confuse' })
      const [targetEnemies, targetAllies] = isConfused ? [allySide, enemiesSide] : [enemiesSide, allySide]

      const _params = [
        unit,
        targetEnemies as CombatUnit[],
        targetAllies as CombatUnit[],
        this,
      ] as const

      await this.actions.executeAutoAttack(..._params)
    }
  }

  isBattleOver(): boolean {
    return !this.player.isAlive || this.units.getAliveEnemies().length === 0
  }

  getBattleResult(): BattleResult {
    if (this.lastBattleResult?.isEscaped) return this.lastBattleResult
    return {
      isVictory: this.player.isAlive && this.units.getAliveEnemies().length === 0,
      isEscaped: false,
      gold: 0,
      exp: 0,
      drops: [],
    }
  }

  async runCombatLoop(initialEnemies: CombatUnit[], world: World) {
    this.lastBattleResult = null

    initialEnemies.forEach((e) => {
      this.appendUnitDeathCallback(e)
      this.units.registerUnit(e)
    })

    Terminal.log(i18n.t('battle.battle_start'))
    Terminal.log(
      i18n.t('battle.enemy_list', {
        names: this.units
          .getAliveEnemies()
          .map((e) => e.name)
          .join(', '),
      })
    )

    const engine = new BattleEngine(this, {
      onRoundStart: async (round) => {
        this.units.refreshPlayerSide()
        Terminal.log(`\n== Turn: ${round} ==`)

        BattleDirector.setUnits({
          playerSide: this.units.getPlayerSide(),
          enemiesSide: this.units.getAliveEnemies(),
        })
      },
    })

    const result = await engine.start()
    this.rewards.handleBattleEnd(result, {
      onVictory: () => {
        printCorpses(world, this.player.pos)
        printDrops(world, this.player.pos)
      },
    })
    this.units.clear()

    BattleDirector.end()

    return result.isVictory
  }

  public toCombatUnit<T extends Player | BattleTarget>(unit: T, type: CombatUnit['type']): CombatUnit<T> {
    return this.units.toCombatUnit(unit, type)
  }

  static calcDamage(attacker: CombatUnit, target: CombatUnit, options: DamageOptions = {}) {
    return CombatService.calcDamage(attacker, target, options)
  }

  public _spawnMonster(monsterId: string) {
    const monster = this.monster.makeMonster(monsterId)
    if (!monster) return
    const unit = this.toCombatUnit(monster, 'monster')
    this.units.registerUnit(unit)
    BattleDirector.updateUnits({ enemiesSide: this.units.getAliveEnemies() })
    this.appendUnitDeathCallback(unit)

    return unit
  }

  public appendUnitDeathCallback(unit: CombatUnit) {
    unit.onDeath = async () => this.rewards.handleUnitDeath(unit.ref as BattleTarget)
  }

  // Exposed for skill executors
  public getEnemiesOf(unit: CombatUnit): CombatUnit[] {
    if (unit.isConfused) {
      return this.units.getAllysOf(unit)
    }

    return this.units.getEnemiesOf(unit)
  }
  public getAllysOf(unit: CombatUnit): CombatUnit[] {
    if (unit.isConfused) {
      return this.units.getEnemiesOf(unit)
    }

    return this.units.getAllysOf(unit)
  }

  public getAggroUnit(unit: CombatUnit): CombatUnit | undefined {
    const allys = this.getAllysOf(unit)

    return allys.find((unit) => unit.hasBuff({ type: 'aggro' }))
  }
}
