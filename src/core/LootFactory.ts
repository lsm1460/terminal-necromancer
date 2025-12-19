import { Player } from '../core/Player'
import { LootBag, Monster } from '../types'
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
  static fromMonster(monster: Monster) {
    return {
      gold: monster.gold ?? 0,
      drops: monster.drops ?? [],
    }
  }
}
