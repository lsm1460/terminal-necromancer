import { Player } from '../core/Player'
import { DropSystem } from '../systems/DropSystem'
import { BattleTarget, LootBag } from '../types'
import { generateId } from '../utils'
import { MapManager } from './MapManager'

export class LootFactory {
  static fromPlayer(player: Player, map: MapManager): LootBag {
    const { x, y } = player.pos
    const tile = map.getTile(x, y)
    
    return {
      scendId: map.currentSceneId,
      id: generateId(),
      tileId: tile.id,
      exp: player.exp,
      gold: Math.ceil(player.gold / 2),
    }
  }

  /** 몬스터 처치 보상 */
  static fromTarget(target: BattleTarget, drop: DropSystem) {
    const _drop = drop.generateDrops(target.dropTableId ?? 'none')

    return _drop
  }
}
