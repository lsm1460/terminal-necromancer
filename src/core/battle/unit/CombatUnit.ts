import { Terminal } from '~/core/Terminal'
import { assetManager } from '~/core/WebAssetManager'
import { Player } from '~/core/player/Player'
import { AttackType, TakeDamageReturn } from '~/core/types'
import { BattleTarget, UnitSprites } from '~/types'
import { Battle, DamageOptions } from '../Battle'
import { BattleDirector } from '../BattleDirector'
import { Buff, BuffOptions, BuffType } from '../Buff'
import { BattleLogFormatter } from './BattleLogFormatter'
import { BuffFilterCondition, UnitBuffManager } from './UnitBuffManager'
import { getOriginId } from '~/core/utils'

type UnitDamageProcessHook = (
  attacker: CombatUnit,
  defender: CombatUnit,
  options: DamageOptions,
  damage?: number
) => Promise<void>

export class CombatUnit<T extends BattleTarget | Player = BattleTarget | Player> {
  public id: string
  public name: string
  public stats: any
  public attackType: AttackType = 'melee'
  public buffManager: UnitBuffManager
  public orderWeight: number
  public phases = 1

  public initBreakPoint = 200
  public breakPoint = 200

  public onBeforeAttackHooks: UnitDamageProcessHook[] = []
  public onBeforeHitHooks: UnitDamageProcessHook[] = []
  public onProcessHitHooks: UnitDamageProcessHook[] = []
  public onAfterAttackHooks: UnitDamageProcessHook[] = []
  public onAfterHitHooks: UnitDamageProcessHook[] = []
  public onDeath?: () => void | Promise<void>
  public onDeathHooks: ((attacker: CombatUnit, options?: DamageOptions) => Promise<void>)[] = []

  constructor(
    public ref: T,
    public type: 'player' | 'minion' | 'monster' | 'npc',
    private manager: Battle
  ) {
    this.id = ref.id
    this.name = ref.name
    this.buffManager = new UnitBuffManager(this)

    this.orderWeight = (ref as any).orderWeight || 0
    this.updateStats()
  }

  public get isPlayerSide() {
    return this.type === 'player' || this.type === 'minion'
  }

  public get isEnemySide() {
    return this.type === 'monster' || this.type === 'npc'
  }

  public get sprites(): UnitSprites | void {
    const originId = getOriginId(this.id)
    return assetManager.getSprites(originId)
  }

  public get isStealth() {
    return this.buffManager.isStealth
  }

  public updateStats() {
    const unit = this.ref as any
    this.stats = {
      atk: unit.computed?.atk || unit.atk || 0,
      def: unit.computed?.def || unit.def || 0,
      agi: unit.computed?.agi || unit.agi || 0,
      eva: unit.computed?.eva || unit.eva || 0,
      crit: unit.computed?.crit || unit.crit || 0,
    }

    this.attackType = unit.computed?.attackType || unit.attackType || 'melee'
  }

  public applyBuff(b: BuffOptions) {
    this.buffManager.applyBuff(b)
  }

  public applyDeBuff(d: BuffOptions) {
    this.buffManager.applyDeBuff(d)
  }

  public hasBuff(_params: BuffFilterCondition) {
    return this.buffManager.hasBuff(_params)
  }

  public hasDeBuff(_params: BuffFilterCondition) {
    return this.buffManager.hasDeBuff(_params)
  }

  public hasImmunity(d: Buff) {
    const skills = this.ref.skills ?? []

    const immunityMap: Record<string, BuffType> = {
      resist_bind: 'bind',
      resist_confuse: 'confuse',
    }

    return skills.some((skill) => immunityMap[skill] === d.type)
  }

  public get buff() {
    return this.buffManager.buffs
  }

  public set buff(val) {
    this.buffManager.buffs = val
  }

  public get deBuff() {
    return this.buffManager.deBuffs
  }

  public set deBuff(val) {
    this.buffManager.deBuffs = val
  }

  public get isConfused() {
    return this.buffManager.isConfused
  }

  public async executeHit(attacker: CombatUnit, options: DamageOptions = {}): Promise<TakeDamageReturn> {
    if (!options.isRedirected) {
      const taunter = this.manager.getAggroUnit(this)
      if (taunter && taunter !== this) {
        return await taunter.executeHit(attacker, { ...options, isRedirected: true })
      }
    }

    await this.runHooks(this.onProcessHitHooks, attacker, options)

    if (!options.isPassive) {
      await this.runHooks(attacker.onBeforeAttackHooks, attacker, options)
      await this.runHooks(this.onBeforeHitHooks, attacker, options)
    }

    const result = this.takeDamage(attacker, options)

    if (!result.isEscape && !options.isPassive) {
      await this.runHooks(attacker.onAfterAttackHooks, attacker, options, result.damage)

      if (!result.isDead) {
        await this.runHooks(this.onAfterHitHooks, attacker, options)
      }
    }

    if (result.isDead) {
      await this.dead(attacker, options)
    }

    return result
  }

  private async runHooks(hooks: Function[] = [], attacker?: CombatUnit, options: DamageOptions = {}, damage?: number) {
    for (const hook of hooks) {
      // 훅의 규격에 맞춰 attacker, defender(this), options를 전달
      await hook(attacker, this, options, damage)
    }
  }

  public takeDamage(attacker: CombatUnit, options: DamageOptions = {}): TakeDamageReturn {
    if (!this.ref.isAlive) {
      return {
        isEscape: false,
        isDead: true,
        damage: 0,
        currentHp: 0,
        isCritical: false,
      }
    }

    const result = Battle.calcDamage(attacker, this, options)
    if (!result.isEscape) {
      this.ref.hp = Math.max(0, this.ref.hp - result.damage)
    }

    BattleDirector.playHit(this.id, result)
    this.logDamage(attacker, result, options)
    return { ...result, currentHp: this.ref.hp, isDead: this.ref.hp <= 0 }
  }

  async dead(attacker?: CombatUnit, options: DamageOptions = {}) {
    if (!this.ref.isAlive) {
      return
    }

    BattleDirector.playDie(this.id)
    this.ref.isAlive = false

    if (this.onDeath) await this.onDeath()

    for (const hook of this.onDeathHooks) {
      await hook(this, options) // 사망한 유닛 자신과 당시 공격 정보를 전달
    }
  }

  private logDamage(attacker: CombatUnit, result: any, options: DamageOptions = {}) {
    const message = BattleLogFormatter.formatDamageLog(attacker.name, this.name, this.ref.hp, result, options)
    Terminal.log(message)
  }

  get finalStats() {
    return {
      atk: Math.max(0, this.stats.atk + this.buffManager.getStatBonus('atk')),
      def: Math.max(0, this.stats.def + this.buffManager.getStatBonus('def')),
      eva: Math.max(0, this.stats.eva + this.buffManager.getStatBonus('eva')),
      agi: Math.max(0, this.stats.agi + this.buffManager.getStatBonus('agi')),
      crit: (this.stats.crit || 0) + this.buffManager.getStatBonus('crit'),
    }
  }

  public removeStealth(): void {
    this.buffManager.removeStealth()
  }

  public removeRandomDeBuff(): void {
    this.buffManager.removeRandomDeBuff()
  }

  public removeBuff(id: BuffOptions['id'], force = false): void {
    this.buffManager.removeBuff(id, force)
  }

  public removeDeBuff(id: BuffOptions['id'], force = false): void {
    this.buffManager.removeDeBuff(id, force)
  }

  public removeRandomBuff(): void {
    this.buffManager.removeRandomBuff()
  }
}
