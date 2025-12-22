import { Player } from '../core/Player'
import { DropSystem } from '../systems/DropSystem'
import { BattleTarget, LootBag, Monster } from '../types'
import { generateId } from '../utils'

export class LootFactory {
  static fromPlayer(player: Player): LootBag {
    const drops: LootBag['drops'] = []

    for (const item of player.inventory) {
      drops.push({
        ...item,
      })
    }

    for (const eq of Object.values(player.equipped)) {
      if (!eq) continue
      drops.push({
        ...eq,
      })
    }

    return {
      id: generateId(),
      x: player.x,
      y: player.y,
      drops,
    }
  }

  /** 몬스터 처치 보상 */
  static fromTarget(target: BattleTarget, drop: DropSystem) {
    const _drop = drop.generateDrops(target.dropTableId ?? 'none')

    return _drop
  }
}
