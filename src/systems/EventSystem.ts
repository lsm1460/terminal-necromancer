// systems/EventSystem.ts
import { Battle } from '../core/Battle'
import { MonsterFactory } from '../core/MonsterFactory'
import { NPCManager } from '../core/NpcManager'
import { Player } from '../core/Player'
import { GameContext, Tile } from '../types'

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
            tile.currentMonster = monster
            console.log(`${monster.name} 등장!`)

            if (monster.preemptive) {
              // 선공몹
              console.log(`${monster.name}의 기습!`)
              const counterDmg = Battle.calculateDamage(player, monster)
              player.damage(counterDmg)
            }
          }
        } else {
          console.log(`${tile.currentMonster.name}(이)가 있다.`)
        }
        break

      case 'npc':
        // 적대 세력은 선공한다
        Battle.executeGroupCounter(player, context)
        break
    }
  }
}
