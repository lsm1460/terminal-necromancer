import { EventBus } from '~/core/EventBus';
import { GameEventType } from '~/core/types';
import { AppContext } from './types';

export class QuestManager {
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

  async startQuest(context: AppContext) {
    if (this.questQue.length === 0) return

    const currentQuests = this.questQue.splice(0)

    for (let quest of currentQuests) {
      if (quest.questType === 'death') this.processNpcDeaths(quest.npcId, context)
    }
  }

  async processNpcDeaths(npcId: string, context: AppContext) {
    const npc = context.npcs.getNPC(npcId)

    if (npc) await npc.afterDead(context)
  }
}
