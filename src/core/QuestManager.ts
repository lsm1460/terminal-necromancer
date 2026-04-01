import npcDeathHandlers from '~/quest'
import { GameContext } from '~/types'
import { NPCManager } from './NpcManager'
import { Player } from './player/Player'

export class QuestManager {
  questQue: { npcId: string; questType: string }[] = []

  constructor(
    private player: Player,
    private npcs: NPCManager
  ) {}

  async initOnDeath() {
    this.npcs.onDeath('death', this.handleDeath)
  }

  private handleDeath = async (npcId: string) => {
    this.questQue.push({ npcId, questType: 'death' })
  }

  public hasQuest(): boolean {
    return this.questQue.length > 0
  }

  async startQuest(context: GameContext) {
    const quests = [...this.questQue]
    this.questQue = []

    for (let quest of quests) {
      if (quest.questType === 'death') {
        const handler = npcDeathHandlers[quest.npcId]
        if (handler) {
          await handler(this.player, context)
        } else {
          console.warn(`No death handler found for NPC: ${quest.npcId}`)
        }
      }
    }
  }
}
