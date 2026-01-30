import { BattleTarget } from '../../types'
import { Player } from '../Player'
import { Battle, Buff } from './Battle'

export class CombatUnit<T extends BattleTarget | Player = BattleTarget | Player> {
  public id: string
  public name: string
  public stats: any
  public buff: Buff[] = []
  public deBuff: Buff[] = []
  public orderWeight: number

  // 어픽스 매니저가 주입할 훅 리스트
  public onAfterHitHooks: ((attacker: CombatUnit, defender: CombatUnit) => Promise<void>)[] = []
  public onDeathHooks: ((unit: CombatUnit) => Promise<void>)[] = []

  constructor(
    public ref: T,
    public type: 'player' | 'minion' | 'monster' | 'npc'
  ) {
    if ('id' in ref) {
      this.id = ref.id || (type === 'player' ? 'player' : 'npc')
      this.name = ref.name
    } else {
      this.id = 'player'
      this.name = 'player'
    }
    this.orderWeight = (ref as any).orderWeight || 0
    this.updateStats()
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
  }

  applyEffect(newEffect: Buff) {
    // 1. 타입에 따라 대상 배열 결정 ('buff'면 buff, 나머지는 deBuff)
    const targetArray = newEffect.type === 'buff' ? this.buff : this.deBuff

    // 2. 중복 확인 및 처리
    const existing = targetArray.find((e) => e.name === newEffect.name)
    if (existing) {
      existing.duration = Math.max(existing.duration, newEffect.duration)
    } else {
      targetArray.push(newEffect)
    }
  }

  applyBuff(b: Buff) {
    switch (b.name) {
      case '광폭화':
        console.log(
          `\n[🔥 강화] ${this.name}의 영혼을 강제로 폭주시켜 위력을 끌어올립니다! (${this.name} HP ${this.ref.hp} / ${this.ref.maxHp})`
        )
        break

      default:
        break
    }

    this.applyEffect(b)
  }

  public applyDeBuff(d: Buff) {
    switch (d.name) {
      case '구속':
        console.log(`\n [!] ${this.name}은/는 구속되어 움직일 수 없습니다!`)
        break
      case '출혈':
        console.log(`\n [!] ${this.name}은/는 깊은 상처를 입고 피를 흘리기 시작합니다!`)
        break
      case '중독':
        console.log(`\n [!] ${this.name}은/는 치명적인 독소에 노출되어 안색이 창백해집니다.`)
        break
      case '조롱':
        console.log(`\n [!] ${this.name}(은)는 분노를 참지 못해 방어 태세가 흐트러집니다!`)
        break
      case '연막':
        console.log(`\n [!] 자욱한 연기가 ${this.name}의 시야를 완전히 가려버립니다!`)
        break
      case '뼈 감옥':
        console.log(`\n [!] 거친 뼈 창살이 ${this.name}의 사지를 옥죄며 솟아오릅니다!`)
        break
      case '심연의 한기':
        console.log(`\n[❄️] 심연의 한기가 대상(${this.name})을 얼려버립니다.`)
        break
      case '노화':
        console.log(`\n[⏳] ${this.name}의 피부가 급격히 메마르며 숨이 가빠집니다! 모든 반응이 눈에 띄게 둔해집니다.`)
        break
      case '부상':
        console.log(`\n[⏳] ${this.name}의 발목에 부상을 입습니다! 움직임이 눈에 띄게 둔해집니다.`)
        break

      default:
        break
    }

    this.applyEffect(d)
  }

  public async takeDamage(attacker: CombatUnit, options: any = {}) {
    if (!this.ref.isAlive) return { isDead: true, damage: 0 }

    const result = Battle.calcDamage(attacker, this, options)
    const { isEscape, damage, isCritical } = result

    if (!isEscape) {
      this.ref.hp = Math.max(0, this.ref.hp - damage)
    }

    // 결과 출력
    this.logDamage(attacker, result)

    const isDead = this.ref.hp <= 0

    if (isDead) {
      // 주입된 사망 어픽스 실행
      this.dead()
    } else if (!isEscape) {
      // 주입된 피격 후 어픽스 실행
      for (const hook of this.onAfterHitHooks) await hook(attacker, this)
    }

    return { ...result, currentHp: this.ref.hp, isDead }
  }

  async dead() {
    this.ref.isAlive = false
    for (const hook of this.onDeathHooks) await hook(this)
  }

  private logDamage(attacker: CombatUnit, result: any) {
    const { isEscape, damage, isCritical } = result
    const hpMsg = `(${this.name}의 남은 HP: ${this.ref.hp})`
    if (isEscape) console.log(`\n💥 ${attacker.name}의 공격! ${this.name} 회피! ${hpMsg}`)
    else
      console.log(
        `\n${isCritical ? '⚡ CRITICAL! ' : ''}${attacker.name}의 공격! ${this.name}에게 ${damage} 피해! ${hpMsg}`
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
    const hasStealth = this.buff.some((b) => b.type === 'stealth')
    if (hasStealth) {
      this.buff = this.buff.filter((b) => b.type !== 'stealth')
      console.log(` \x1b[90m[!] ${this.name}의 은신이 해제되어 정체가 드러났습니다!\x1b[0m`)

      this.applyDeBuff({ name: '드러난 자', duration: 2, type: 'expose' })
    }
  }

  public removeRandomDebuff(): void {
    if (this.deBuff.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.deBuff.length)
    const removed = this.deBuff.splice(randomIndex, 1)[0]

    console.log(` \x1b[32m[!] ${this.name}(은)는 기운을 차려 '${removed.name}' 효과에서 벗어났습니다!\x1b[0m`)
  }

  public removeRandomBuff(): void {
    if (this.buff.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.buff.length)
    const removed = this.buff.splice(randomIndex, 1)[0]

    console.log(` \x1b[31m[!] ${this.name}에게 걸려있던 '${removed.name}' 효과가 강제로 해제되었습니다!\x1b[0m`)
  }
}
