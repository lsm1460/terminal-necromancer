import { AttackType, BattleTarget } from '../types'
import { Player } from './Player'

/**
 * 1. 인터페이스 병합 (Declaration Merging)
 * 클래스와 인터페이스의 이름을 같게 선언하여,
 * 클래스가 BattleTarget의 모든 속성을 가지고 있음을 TypeScript에 알립니다.
 */
interface KnightWrapper extends BattleTarget {}

class KnightWrapper {
  constructor(
    public raw: BattleTarget,
    private player: Player
  ) {
    // 2. 런타임 자동 연결: raw의 모든 속성을 이 클래스에 바인딩
    Object.keys(raw).forEach((key) => {
      // 이미 클래스에 getter/setter가 정의된 속성은 건너뜁니다.
      if (Object.getOwnPropertyDescriptor(KnightWrapper.prototype, key)) return

      Object.defineProperty(this, key, {
        get: () => (this.raw as any)[key],
        set: (v) => {
          ;(this.raw as any)[key] = v
        },
        enumerable: true,
        configurable: true,
      })
    })
  }

  private get isLich() {
    return this.player.hasAffix('TABOO')
  }
  private get hasHorse() {
    return this.player.hasAffix('WARHORSE')
  }

  get name() {
    if (this.isLich) {
      return this.hasHorse ? '망령의 군주 발타자르' : '타락한 리치 발타자르'
    }

    return this.hasHorse ? '심연의 기사 발타자르' : this.raw.name
  }

  get atk() {
    const base = this.raw.baseAtk || this.raw.atk
    return this.isLich ? Math.floor(base * 0.6) : base
  }

  get def() {
    const base = this.raw.baseDef || this.raw.def
    return this.isLich ? Math.floor(base * 0.6) : base
  }

  get maxHp() {
    const base = this.raw.baseMaxHp || this.raw.maxHp

    return this.hasHorse ? Math.floor(base * 1.2) : base
  }

  get skills(): string[] {
    const state = `${this.isLich ? 'LICH' : 'KNIGHT'}_${this.hasHorse ? 'HORSE' : 'FOOT'}`

    const skillTable: Record<string, string[]> = {
      LICH_HORSE: ['abyssal_gallop', 'bone_prison', 'aging_curse'], // 망령의 군주
      LICH_FOOT: ['bone_prison', 'aging_curse'], // 타락한 리치
      KNIGHT_HORSE: ['dread_charge', 'power_smash'], // 심연의 기사
      KNIGHT_FOOT: this.raw.skills || [], // 기본 기사 (원본 참조)
    }

    // 3. 해당하는 상태의 스킬셋을 반환 (없을 경우를 대비해 원본 스킬을 백업으로)
    return skillTable[state] || this.raw.skills!
  }

  get attackType(): AttackType {
    return this.isLich ? 'ranged' : 'melee'
  }

  get hp() {
    return this.raw.hp
  }
  set hp(v: number) {
    this.raw.hp = v
  }

  get isAlive() {
    return this.raw.isAlive
  }

  set isAlive(v: boolean) {
    this.raw.isAlive = v
  }
}

export default KnightWrapper
