import { BattleTarget, GameContext } from '~/types'
import { MonsterFactory } from '../MonsterFactory'
import { Player } from '../player/Player'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { Terminal } from '../Terminal'
import { BattleActionHandler } from './BattleActionHandler'
import { BattleEngine, BattleManager } from './BattleEngine'
import { BattleRewardSystem } from './BattleRewardSystem'
import { BattleUnitManager } from './BattleUnitManager'
import { CombatService, DamageOptions } from './CombatService'
import { CombatUnit } from './unit/CombatUnit'
import { BattleResult } from './types'
import { BattleDirector } from './BattleDirector'

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
    this.units = new BattleUnitManager(player)
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

    Terminal.log(`\n━━━━━━━━━ [ ${unit.name}의 차례 ] ━━━━━━━━━`)
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

    Terminal.log(`\n⚔️ 전투가 시작되었습니다!`)
    Terminal.log(
      `적: ${this.units
        .getAliveEnemies()
        .map((e) => e.name)
        .join(', ')}`
    )

    const engine = new BattleEngine(this, {
      onRoundStart: async (round) => {
        this.initPlayerUnit()
        Terminal.log(`\n============== turn: ${round} ==============`)

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

  private initPlayerUnit() {
    this.units.registerUnit(this.toCombatUnit(this.player, 'player'))
    if (this.player.minions) {
      this.player.minions.forEach((m) => {
        if (m.isAlive) {
          const mUnit = this.toCombatUnit(m, 'minion')
          this.units.registerUnit(mUnit)
          mUnit.onDeath = async () => {
            this.units.unregisterUnit(m.id)
            m.hp = 0
            m.isAlive = false
            this.player.removeMinion(m.id)
            Terminal.log(`\n💀 ${m.name}이(가) 쓰러졌습니다!`)
          }
        }
      })
    }
  }

  public toCombatUnit<T extends Player | BattleTarget>(unit: T, type: CombatUnit['type']): CombatUnit<T> {
    const cached = this.units.getUnit(unit.id)
    if (cached) return cached as CombatUnit<T>
    const combatUnit = new CombatUnit<T>(unit, type)
    this.npcSkills.setupPassiveHook(combatUnit, this)
    return combatUnit
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
      expiredEffects.forEach((e) => {
        Terminal.log(`[효과 만료] ${unit.name}의 ${type === 'buff' ? '✨' : '💢'} [${e.name}] 효과가 사라졌습니다.`)
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
