import { Player } from '../core/Player';
import { GameContext } from '../types';

export interface NPCHandler {
  npcId: string;
  getChoices(): { name: string; message: string }[];
  handle(action: string, player: Player, context: GameContext): Promise<void>;
}