// systems/SaveSystem.ts
import fs from 'fs'
import { Player } from '../core/Player'
import { LootBag } from '../types'

export class SaveSystem {
  constructor(private path: string) {}

  load() {
    if (!fs.existsSync(this.path)) return null
    return JSON.parse(fs.readFileSync(this.path, 'utf-8'))
  }

  save(saveData: {player: Player, drops: LootBag[]}) {
    fs.writeFileSync(this.path, JSON.stringify({
      ...saveData,
      player: saveData.player.raw
    }, null, 2))
  }
}
