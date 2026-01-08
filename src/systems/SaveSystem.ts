// systems/SaveSystem.ts
import fs from 'fs'
import { Player } from '../core/Player'
import { LootBag, NPCState } from '../types'

type SaveData = {
    player: Player;
    sceneId: string;
    npcs: {
        states: Record<string, NPCState>;
        factionHostility: Record<string, number>;
        factionContribution: Record<string, number>;
    };
    drop: LootBag | null;
    completedEvents: string[];
}

export class SaveSystem {
  constructor(private path: string) {}

  load(): SaveData | null {
    if (!fs.existsSync(this.path)) return null
    return JSON.parse(fs.readFileSync(this.path, 'utf-8'))
  }

  save(saveData: SaveData) {
    fs.writeFileSync(this.path, JSON.stringify({
      ...saveData,
      player: saveData.player.raw
    }, null, 2))
  }
}
