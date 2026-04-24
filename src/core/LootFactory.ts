import { DropSystem } from '~/core/item/DropSystem'
import { Player } from '~/core/player/Player'
import { BattleTarget } from '~/types'
import { generateId } from '~/utils'
import { IMapManager, LootBag } from './types'

export class LootFactory {
  static fromPlayer(player: Player, map: IMapManager): LootBag {
    const tile = map.getTile(player.pos)!
    
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
