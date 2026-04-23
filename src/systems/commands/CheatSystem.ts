import { Terminal } from '~/core'
import { ICommandManager, ICommandSystem } from '~/core/types'
import { AppContext } from '../types'

export class CheatSystem implements ICommandSystem {
  constructor(private context: AppContext) {}

  install(handler: ICommandManager) {
    const cheats = [
      {
        key: 'show me the money',
        execute: () => {
          this.context.player.gainGold(10000)
          Terminal.log('\n[Cheat] Player get 10,000 gold')
          return true
        },
      },
      {
        key: 'black sheep wall',
        execute: () => {
          this.context.cheats.isFullMap = true
          Terminal.log('\n[Cheat] Map visibility enabled.')
          return true
        },
      },
      {
        key: 'sometimes, dead is better',
        execute: () => {
          const monster = this.context.monster.makeMonster('ghoul')
          if (monster) {
            const tile = this.context.currentTile
            tile.monsters = tile.monsters ?? []
            tile.monsters.push(monster)
            Terminal.log('\n[Cheat] a ghoul is spawned.')
          }
          return true
        },
      },
      {
        key: 'make room!',
        execute: () => {
          // player._maxSkeleton 접근을 위해 타입 캐스팅이 필요할 수 있음
          ;(this.context.player as any)._maxSkeleton += 1
          Terminal.log(`\n[Cheat] The legion's limit has been expanded.`)
          return true
        },
      },
      {
        key: 'the ring is mine',
        execute: () => {
          this.context.cheats.playerIsHide = true
          Terminal.log('\n[Cheat] You can disappear. That is its power.')
          return true
        },
      },
    ]

    cheats.forEach((cheat) => {
      handler.register(cheat.key, () => cheat.execute())
    })
  }
}
