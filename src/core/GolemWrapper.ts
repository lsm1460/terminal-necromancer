import { BattleTarget } from '../types'
import { Player } from './Player'

interface GolemWrapper extends BattleTarget {}

class GolemWrapper {
  upgradeLimit: number

  constructor(
    public raw: BattleTarget,
    public upgrade: ('machine' | 'soul')[],
    private player: Player
  ) {
    Object.keys(raw).forEach((key) => {
      if (Object.getOwnPropertyDescriptor(GolemWrapper.prototype, key)) return
      Object.defineProperty(this, key, {
        get: () => (this.raw as any)[key],
        set: (v) => {
          ;(this.raw as any)[key] = v
        },
        enumerable: true,
        configurable: true,
      })
    })

    this.upgradeLimit = player.upgradeLimit
  }

  private get machineCount() {
    return this.upgrade.filter((u) => u === 'machine').length
  }
  private get soulCount() {
    return this.upgrade.filter((u) => u === 'soul').length
  }
  private get hasThorns() {
    return this.player.hasAffix('THORNS')
  }

  get atk(): number {
    const bonus = this.soulCount * 30 + this.machineCount * 10
    return this.raw.atk + bonus
  }

  get def(): number {
    const bonus = this.machineCount * 30 + this.soulCount * 5
    return this.raw.def + bonus
  }

  get maxHp(): number {
    const bonusHp = this.machineCount * 40 + this.soulCount * 20
    return this.raw.maxHp + bonusHp
  }

  get name(): string {
    const m = this.machineCount
    const s = this.soulCount
    let baseName = this.raw.name

    // 1. 강화 상태에 따른 기본 명칭 결정
    if (s >= 3 && m >= 3) {
      baseName = '심연의 강철 마신'
    } else if (s >= 3) {
      baseName = '원념의 학살자'
    } else if (m >= 3) {
      baseName = '강철 요새'
    } else if (s > 0 && m > 0) {
      baseName = '개조된 마력 골렘'
    } else if (s > 0) {
      baseName = '생체 주입형 골렘'
    } else if (m > 0) {
      baseName = '강화형 기계 골렘'
    }

    // 2. THORNS 어픽스가 있다면 '가시 돋친' 프리픽스 부여
    return this.hasThorns ? `가시 돋친 ${baseName}` : baseName
  }

  get skills(): string[] {
    // 임의 수치 조정 없이 스킬만 변경
    return this.hasThorns ? ['thorns'] : this.raw.skills!
  }

  // hp 참조는 유지 (전투 중 실시간 반영을 위해 필요)
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

export default GolemWrapper
