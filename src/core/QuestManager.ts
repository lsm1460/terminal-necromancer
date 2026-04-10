import { GameContext } from '~/types';
import { NPCManager } from './NpcManager';

export class QuestManager {
  private questQue: { npcId: string; questType: string }[] = []

  constructor() {}

  public registerDeath(npcId: string) {
    this.questQue.push({ npcId, questType: 'death' });
  }

  public hasQuest(): boolean {
    return this.questQue.length > 0
  }

  async startQuest(context: GameContext) {
    if (this.questQue.length === 0) return

    const currentQuests = this.questQue.splice(0)

    for (let quest of currentQuests) {
      if (quest.questType === 'death') this.processNpcDeaths(quest.npcId, context)
    }
  }

  async processNpcDeaths(npcId: string, context: GameContext) {
    const npc = context.npcs.getNPC(npcId)

    if (npc) await npc.afterDead(context)
  }
}
