import { EventBus } from '~/core/EventBus'
import { GameContext, GameEventType, IQuestManager } from '~/core/types'

export class QuestManager implements IQuestManager {
  private questQue: { npcId: string; questType: string }[] = []

  constructor(eventBus: EventBus) {
    eventBus.subscribe(GameEventType.NPC_IS_DEAD, ({ npcId }) => this.registerDeath(npcId))
  }

  public registerDeath(npcId: string) {
    this.questQue.push({ npcId, questType: 'death' })
  }

  public hasQuest(): boolean {
    return this.questQue.length > 0
  }

  async startQuest(context: GameContext): Promise<string | void> {
    if (this.questQue.length === 0) return

    const currentQuests = this.questQue.splice(0)

    for (let quest of currentQuests) {
      if (quest.questType === 'death') {
        const result = await this.processNpcDeaths(quest.npcId, context)
        if (result === 'exit') return 'exit'
      }
    }
  }

  async processNpcDeaths(npcId: string, context: GameContext): Promise<string | void> {
    const npc = context.npcs.getNPC(npcId)

    if (npc) {
      return (await npc.afterDead(context)) as string | void
    }
  }
}
