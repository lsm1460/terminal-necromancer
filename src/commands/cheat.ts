import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/types'

export const handleCheat = (rawCmd: string, player: Player, context: GameContext): boolean => {
  const trimmed = rawCmd.trim()
  const { map } = context
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  switch (trimmed) {
    case 'show me the money':
      player.gainGold(10000)
      Terminal.log('\n[Cheat] Player get 10,000 gold')
      return true

    case 'black sheep wall':
      context.cheats.isFullMap = true
      Terminal.log('\n[Cheat] Map visibility enabled.')
      return true

    case 'sometimes, dead is better':
      const monster = context.monster.makeMonster('ghoul')
      if (monster) {
        tile.monsters = tile.monsters ?? []
        tile.monsters.push(monster)

        Terminal.log('\n[Cheat] a ghoul is spawned.')
      }
      return true
    case 'make room!':
      player._maxSkeleton += 1
      Terminal.log(`\n[Cheat] The legion's limit has been expanded.`)
      return true

    // 향후 다른 치트키 추가 가능
    // case 'power overwhelming':
    //   ...
    //   return true

    default:
      return false
  }
}
