// systems/EventSystem.ts
import { Player } from '../core/Player'
import { GameContext, GameMode, Tile } from '../types'
import { MonsterFactory } from '../core/MonsterFactory'
import { NPCManager } from '../core/NpcManager'

export class EventSystem {
  constructor(
    private monsterFactory: MonsterFactory,
    private npcManager: NPCManager
  ) {}

  handle(tile: Tile, player: Player, context: GameContext) {
    switch (tile.event) {
      case 'item': {
        break
      }

      case 'monster':
      case 'monster-group-level-1':
        if (!tile.currentMonster) {
          const monster = this.monsterFactory.spawn(tile)

          if (monster) {
            context.mode = GameMode.BATTLE
            tile.currentMonster = monster
            console.log(`야생의 ${monster.name} 등장!`)
          }
        } else {
          context.mode = GameMode.BATTLE
          console.log(`야생의 ${tile.currentMonster.name}(이)가 있다.`)
        }
        break
    }
  }
}
