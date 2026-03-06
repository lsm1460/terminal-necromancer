import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import { AttackType, BattleTarget } from '~/types'
import { Battle, Buff, DamageOptions } from '../Battle'
import { BattleDirector } from '../BattleDirector'
import { EFFECT_MESSAGES } from './consts'

type UnitDamageProcessHook = (attacker: CombatUnit, defender: CombatUnit, options: DamageOptions) => Promise<void>

export class CombatUnit<T extends BattleTarget | Player = BattleTarget | Player> {
  public id: string
  public name: string
  public stats: any
  public attackType: AttackType = 'melee'
  public buff: Buff[] = []
  public deBuff: Buff[] = []
  public orderWeight: number

  // 어픽스 매니저가 주입할 훅 리스트
  public onBeforeAttackHooks: UnitDamageProcessHook[] = []
  public onBeforeHitHooks: UnitDamageProcessHook[] = []
  public onAfterAttackHooks: UnitDamageProcessHook[] = []
  public onAfterHitHooks: UnitDamageProcessHook[] = []
  public onDeath?: () => void | Promise<void>
  public onDeathHooks: ((attacker: CombatUnit, options?: DamageOptions) => Promise<void>)[] = []

  constructor(
    public ref: T,
    public type: 'player' | 'minion' | 'monster' | 'npc'
  ) {
    this.id = ref.id
    this.name = ref.name

    this.orderWeight = (ref as any).orderWeight || 0
    this.updateStats()
  }

  public get isPlayerSide() {
    return this.type === 'player' || this.type === 'minion'
  }

  public get isEnemySide() {
    return this.type === 'monster' || this.type === 'npc'
  }

  public get sprites() {
    const originId = this.id.split('::')[0]
    return {
      idle: [`${originId}_idle_0`, `${originId}_idle_1`],
      attack: `${originId}_attack`,
      hit: `${originId}_hit`,
      die: `${originId}_die`,
      escape: `${originId}_escape`,
    }
  }

  public get isStealth() {
    return this.buff.some((b) => b.type === 'stealth')
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

  private processEffect(effect: Buff, action: 'apply' | 'remove', force = false): void {
    const isBuff = ['buff', 'stealth'].includes(effect.type)
    const targetArray = isBuff ? this.buff : this.deBuff

    if (action === 'apply') {
      const existing = targetArray.find((e) => e.name === effect.name)
      if (existing) {
        existing.duration = Math.max(existing.duration, effect.duration)
      } else {
        targetArray.push(effect)
      }

      const getMsg = EFFECT_MESSAGES[effect.name]
      if (getMsg) {
        Terminal.log(getMsg(this.name, this.ref.hp, this.ref.maxHp))
      }
    } else {
      const initialLength = targetArray.length
      const newArray = targetArray.filter((b) => {
        if (b.name !== effect.name) return true
        if (b.isLocked && !force) return true
        return false
      })

      if (isBuff) this.buff = newArray
      else this.deBuff = newArray

      if (newArray.length < initialLength) {
        Terminal.log(`\n✨ [상태 변화] ${this.name}에게서 [${effect.name}] 효과가 사라졌습니다.`)
      }
    }
  }

  applyEffect(newEffect: Buff) {
    this.processEffect(newEffect, 'apply')
  }

  applyBuff(b: Buff) {
    this.applyEffect(b)
  }

  public applyDeBuff(d: Buff) {
    this.applyEffect(d)
  }

  public async executeHit(attacker: CombatUnit, options: DamageOptions = {}) {
    // 1. [Before]
    if (!options.isPassive) {
      await this.runHooks(attacker.onBeforeAttackHooks, attacker, options)
      await this.runHooks(this.onBeforeHitHooks, attacker, options)
    }

    // 2. [Action]
    const result = await this.takeDamage(attacker, options)

    // 3. [After]
    if (!result.isEscape && !options.isPassive) {
      await this.runHooks(attacker.onAfterAttackHooks, attacker, options)

      if (!result.isDead) {
        await this.runHooks(this.onAfterHitHooks, attacker, options)
      }
    }

    // 4. [Death] - 사망 시에는 공격 정보(options)가 필요할 수 있으므로 함께 전달
    if (result.isDead) {
      await this.dead(attacker, options)
    }

    return result
  }

  /**
   * 비동기 훅 리스트를 순차적으로 실행하는 내부 헬퍼
   */
  private async runHooks(hooks: Function[] = [], attacker?: CombatUnit, options: DamageOptions = {}) {
    for (const hook of hooks) {
      // 훅의 규격에 맞춰 attacker, defender(this), options를 전달
      await hook(attacker, this, options)
    }
  }

  /**
   * [순수 데미지 정산]
   */
  public async takeDamage(attacker: CombatUnit, options: DamageOptions = {}) {
    if (!this.ref.isAlive) return { isEscape: false, isDead: true, damage: 0 }

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
    const { isEscape, damage, isCritical } = result

    // --- 라벨 빌더 ---
    const labels: string[] = []

    // 주요 상태 라벨 (색상별 구분)
    if (options.isPassive) labels.push('\x1b[36m[패시브]\x1b[0m') // 청록
    if (options.isSureHit) labels.push('\x1b[33m[필중]\x1b[0m') // 노랑
    if (options.isSureCrit) labels.push('\x1b[31m[확정 치명]\x1b[0m') // 빨강
    if (options.isIgnoreDef) labels.push('\x1b[35m[방어 관통]\x1b[0m') // 자색
    if (options.isFixed) labels.push('\x1b[32m[고정 피해]\x1b[0m') // 녹색

    const labelPrefix = labels.length > 0 ? `${labels.join(' ')} ` : ''
    const hpStatus = `\x1b[90m(${this.name}의 남은 HP: ${this.ref.hp})\x1b[0m`

    // 1. 회피했을 경우
    if (isEscape) {
      Terminal.log(
        `${labelPrefix}\x1b[37m${attacker.name}\x1b[0m의 공격! 💨 \x1b[37m${this.name}\x1b[0m이(가) 회피했습니다. ${hpStatus}`
      )
      return
    }

    if (damage <= 0) {
      Terminal.log(
        `${labelPrefix}\x1b[37m${attacker.name}\x1b[0m의 공격! 🛡️ 하지만 \x1b[37m${this.name}\x1b[0m에게 피해를 주지 못했습니다. ${hpStatus}`
      )
      return
    }

    let damageMsg = ''
    if (isCritical) {
      damageMsg = `\x1b[1m\x1b[31m⚡ CRITICAL! ${damage}\x1b[0m`
    } else {
      damageMsg = `\x1b[31m${damage}\x1b[0m`
    }

    Terminal.log(
      `${labelPrefix}\x1b[37m${attacker.name}\x1b[0m의 공격! \x1b[37m${this.name}\x1b[0m에게 ${damageMsg}의 피해! ${hpStatus}`
    )
  }

  get finalStats() {
    // key: keyof Buff를 통해 Buff의 속성 이름만 들어올 수 있게 제한합니다.
    const getSum = (arr: Buff[], key: keyof Buff) => arr.reduce((acc, b) => acc + (Number(b[key]) || 0), 0)

    return {
      atk: Math.max(0, this.stats.atk + getSum(this.buff, 'atk') - getSum(this.deBuff, 'atk')),
      def: Math.max(0, this.stats.def + getSum(this.buff, 'def') - getSum(this.deBuff, 'def')),
      eva: Math.max(0, this.stats.eva + getSum(this.buff, 'eva') - getSum(this.deBuff, 'eva')),
      crit: (this.stats.crit || 0) + getSum(this.buff, 'crit') - getSum(this.deBuff, 'crit'),
    }
  }

  public removeStealth(): void {
    const canReveal = this.buff.some((b) => b.type === 'stealth' && !b.isLocked)

    if (canReveal) {
      this.buff = this.buff.filter((b) => b.type !== 'stealth' || b.isLocked)

      Terminal.log(` \x1b[90m[!] ${this.name}의 은신이 해제되어 정체가 드러났습니다!\x1b[0m`)
      this.applyDeBuff({ name: '드러난 자', duration: 2, type: 'expose' })
    }
  }

  public removeRandomDeBuff(): void {
    if (this.deBuff.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.deBuff.length)
    const removed = this.deBuff.splice(randomIndex, 1)[0]

    Terminal.log(` \x1b[32m[!] ${this.name}(은)는 기운을 차려 '${removed.name}' 효과에서 벗어났습니다!\x1b[0m`)
  }

  public removeBuff(name: string, force = false): void {
    this.processEffect({ name, type: 'buff' } as Buff, 'remove', force)
  }

  public removeDeBuff(name: string, force = false): void {
    this.processEffect({ name, type: 'deBuff' } as Buff, 'remove', force)
  }

  public removeRandomBuff(): void {
    if (this.buff.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.buff.length)
    const removed = this.buff.splice(randomIndex, 1)[0]

    Terminal.log(` \x1b[31m[!] ${this.name}에게 걸려있던 '${removed.name}' 효과가 강제로 해제되었습니다!\x1b[0m`)
  }
}
