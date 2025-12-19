// core/MonsterFactory.ts
import { DropSystem } from '../systems/DropSystem'
import { Tile, Monster } from '../types'

export class MonsterFactory {
  constructor(
    private data: Record<string, Monster[]>,
    private dropSystem: DropSystem
  ) {}

  spawn(tile: Tile): Monster | null {
    if (!tile.event.startsWith('monster')) return null

    const group = this.data[tile.event]
    if (!group?.length) return null

    // encounterRate를 가중치로 사용
    const totalRate = group.reduce((sum, m) => sum + (m.encounterRate ?? 0), 0)

    // 전부 0이면 출현 없음
    if (totalRate <= 0) return null

    // 1) 출현 여부 결정
    // totalRate가 100 미만이면 일부 확률로 미출현
    if (totalRate < 100) {
      const appearRoll = Math.random() * 100
      if (appearRoll >= totalRate) return null
    }

    // 2) 어떤 몬스터가 나올지 가중치로 선택
    const roll = Math.random() * totalRate

    let acc = 0
    const selected = group.find((m) => {
      acc += m.encounterRate ?? 0
      return roll < acc
    })

    if (!selected) return null

    const baseMonster = { ...selected }
    const { gold, drops } = this.dropSystem.generateDrops(baseMonster.dropTableId ?? 'none')

    return { ...baseMonster, gold, drops }
  }
}
