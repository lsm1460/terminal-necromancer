import { BattleTarget } from '../types'
import { Player } from './Player'

interface GolemWrapper extends BattleTarget {}

class GolemWrapper {
  constructor(
    public raw: BattleTarget,
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
  }

  private get hasThorns() {
    return this.player.hasAffix('THORNS')
  }

  get name(): string {
    // 임의 수치 조정 없이 이름만 변경
    return this.hasThorns ? '가시가 돋아난 기계 골렘' : this.raw.name
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
}

export default GolemWrapper