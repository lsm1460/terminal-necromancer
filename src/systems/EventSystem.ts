// systems/EventSystem.ts
import { Player } from '../core/Player'
import { Tile } from '../types'
import { MonsterFactory } from '../core/MonsterFactory'

export class EventSystem {
  constructor(private monsterFactory: MonsterFactory) {}

  handle(tile: Tile, player: Player) {
    switch (tile.event) {
      case 'item': {
        break
      }

      case 'monster':
      case 'monster-group-level-1':
        if (!tile.currentMonster) {
          const monster = this.monsterFactory.spawn(tile)
          if (monster) {
            tile.currentMonster = monster
            console.log(`야생의 ${monster.name} 등장!`)
          }
        } else {
          console.log(`야생의 ${tile.currentMonster.name}(이)가 있다.`)
        }
        break

      case 'trap':
        break
    }
  }
}
