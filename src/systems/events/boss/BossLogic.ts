import { CombatUnit } from '../../../core/battle/CombatUnit'
import { Player } from '../../../core/Player'
import { GameContext, NPC } from '../../../types'

export interface BossLogic {
  // 보스전의 적 구성원을 생성하여 반환하는 메서드
  createEnemies(bossNpc: NPC, eventData: any, context: GameContext): CombatUnit[]

  onVictory?: (player: Player, context: GameContext) => Promise<void>
}
