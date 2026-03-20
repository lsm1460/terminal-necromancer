import { GameContext, NPC } from '~/types'
import { Player } from './player/Player'
import npcHandlers from '~/npc'

export class QuestManager {
  static hasQuest(player: Player, npcId: string, context: GameContext): boolean {
    const handler = npcHandlers[npcId]
    if (!handler) return false

    if (handler.hasQuest) {
      return handler.hasQuest(player, context)
    }

    return false
  }
}
