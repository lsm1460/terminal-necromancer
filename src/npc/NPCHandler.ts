import { Player } from '../core/Player';
import { GameContext, NPC } from '../types';

export interface NPCHandler {
  npcId: string;
  getChoices(context: GameContext): { name: string; message: string }[];
  handle(action: string, player: Player, npc: NPC, context: GameContext): Promise<void>;
}

export async function handleTalk(npc: NPC) {
  if (!npc.lines || npc.lines.length === 0) {
    console.log(`\n💬 [${npc.name}]: ...`)
    return
  }

  const randomIndex = Math.floor(Math.random() * npc.lines.length)
  const selectedLine = npc.lines[randomIndex]

  console.log(`\n💬 [${npc.name}]: "${selectedLine}"`)
}