import i18n from '~/i18n'
import { BattleTarget, GameContext } from '~/types'
import { MonsterFactory } from '../MonsterFactory'
import { Player } from '../player/Player'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { Terminal } from '../Terminal'
import { BattleActionHandler } from './BattleActionHandler'
import { BattleDirector } from './BattleDirector'
import { BattleEngine, BattleManager } from './BattleEngine'
import { BattleRewardSystem } from './BattleRewardSystem'
import { BattleUnitManager } from './BattleUnitManager'
import { CombatService, DamageOptions } from './CombatService'
import { BattleResult } from './types'
import { CombatUnit } from './unit/CombatUnit'

export type { DamageOptions } from './CombatService'

export type Buff = {
  name: string
  duration: number
  type: 'deBuff' | 'bind' | 'buff' | 'dot' | 'focus' | 'stealth' | 'expose'
  atk?: number
  agi?: number
  def?: number
  eva?: number
  hp?: number
  crit?: number
  isLocked?: boolean
}

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
  private currentContext: GameContext | null = null

  constructor(
    private player: Player,
    public monster: MonsterFactory,
    public npcSkills: NpcSkillManager
  ) {
    this.units = new BattleUnitManager(player, this, npcSkills)
    this.rewards = new BattleRewardSystem(player, this.units)
    this.actions = new BattleActionHandler(player, this.units, npcSkills)
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
    if (!this.currentContext) return

    Terminal.log(i18n.t('battle.turn_start', { name: unit.name }))
    this.updateEffectsDuration(unit)

    if (await this.actions.handleUnitDeBuff(unit)) return

    const enemiesSide = this.units.getEnemiesOf(unit)
    const allySide = this.units.getAllysOf(unit)

    if (unit.type === 'player') {
      const isEscaped = await this.actions.handlePlayerAction(unit as CombatUnit<Player>, allySide, this.currentContext)
      if (isEscaped) {
        this.lastBattleResult = { isVictory: false, isEscaped: true, gold: 0, exp: 0, drops: [] }
        return true
      }
    } else {
      await this.actions.executeAutoAttack(
        unit,
        enemiesSide as CombatUnit<BattleTarget>[],
        allySide,
        this.currentContext
      )
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

  async runCombatLoop(initialEnemies: CombatUnit[], context: GameContext) {
    this.currentContext = context
    this.lastBattleResult = null

    initialEnemies.forEach((e) => {
      e.onDeath = async () => this.rewards.handleUnitDeath(e.ref as BattleTarget, context)
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
        Terminal.log(`\n============== Turn: ${round} ==============`)

        BattleDirector.setUnits({
          playerSide: this.units.getPlayerSide(),
          enemiesSide: this.units.getAliveEnemies(),
        })
      },
    })

    const result = await engine.start()
    this.rewards.handleBattleEnd(result)
    this.units.clear()
    this.currentContext = null

    BattleDirector.end()

    return result.isVictory
  }

  public toCombatUnit<T extends Player | BattleTarget>(unit: T, type: CombatUnit['type']): CombatUnit<T> {
    return this.units.toCombatUnit(unit, type)
  }

  static calcDamage(attacker: CombatUnit, target: CombatUnit, options: DamageOptions = {}) {
    return CombatService.calcDamage(attacker, target, options)
  }

  private updateEffectsDuration(unit: CombatUnit) {
    const effectTypes: ('buff' | 'deBuff')[] = ['buff', 'deBuff']
    effectTypes.forEach((type) => {
      if (!unit[type]) return
      unit[type].forEach((effect) => effect.duration--)
      const expiredEffects = unit[type].filter((e) => e.duration <= 0)

      const messageKey = type === 'buff' ? 'battle.effect_expired.buff' : 'battle.effect_expired.debuff'
      expiredEffects.forEach((e) => {
        Terminal.log(
          i18n.t(messageKey, {
            unitName: unit.name,
            effectName: e.name,
          })
        )
      })

      unit[type] = unit[type].filter((e) => e.duration > 0)
    })
  }

  public _spawnMonster(monsterId: string, context: GameContext) {
    const monster = this.monster.makeMonster(monsterId)
    if (!monster) return
    const unit = this.toCombatUnit(monster, 'monster')
    this.units.registerUnit(unit)
    BattleDirector.updateUnits({ enemiesSide: this.units.getAliveEnemies() })
    unit.onDeath = async () => this.rewards.handleUnitDeath(monster as BattleTarget, context)
    return unit
  }

  // Exposed for skill executors
  public getEnemiesOf(attacker: CombatUnit): CombatUnit[] {
    return this.units.getEnemiesOf(attacker)
  }
  public getAllysOf(attacker: CombatUnit): CombatUnit[] {
    return this.units.getAllysOf(attacker)
  }
}
