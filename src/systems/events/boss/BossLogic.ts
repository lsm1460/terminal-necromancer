import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'

export interface BossLogic {
  postTalk: string[]
  withMonsterGroup?: string

  createEnemies(bossNpc: NPC, context: GameContext, player: Player): Promise<CombatUnit[]>

  onVictory?: (player: Player, context: GameContext) => Promise<void>

  defeatTalk?: string[]
}
