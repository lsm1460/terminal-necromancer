import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'

export interface BossLogic {
  postTalk: string[]
  withMonsterGroup?: string

  createEnemies(bossNpc: NPC, context: GameContext): Promise<CombatUnit[]>

  onVictory?: (bossNpc: NPC, context: GameContext) => Promise<void | 'exit'>

  defeatTalk?: string[]
}
