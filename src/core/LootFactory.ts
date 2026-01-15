import { Player } from '../core/Player'
import { DropSystem } from '../systems/DropSystem'
import { BattleTarget, LootBag } from '../types'
import { generateId } from '../utils'
import { MapManager } from './MapManager'

export class LootFactory {
  static fromPlayer(player: Player, map: MapManager): LootBag {
    return {
      scendId: map.currentSceneId,
      id: generateId(),
      x: player.x,
      y: player.y,
      exp: player.expToNextLevel(),
      gold: player.gold
    }
  }

  /** 몬스터 처치 보상 */
  static fromTarget(target: BattleTarget, drop: DropSystem) {
    const _drop = drop.generateDrops(target.dropTableId ?? 'none')
    
    return _drop
  }
}
