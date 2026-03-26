import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/types'

export const handleCheat = (rawCmd: string, player: Player, context: GameContext): boolean => {
  const trimmed = rawCmd.trim()

  switch (trimmed) {
    case 'show me the money':
      player.gainGold(10000)
      Terminal.log('\n[Cheat] Player get 10,000 gold')
      return true

    case 'black sheep wall':
      context.cheats.isFullMap = true
      Terminal.log('\n[Cheat] Map visibility enabled.')
      return true
    
    // 향후 다른 치트키 추가 가능
    // case 'power overwhelming':
    //   ...
    //   return true

    default:
      return false
  }
}
