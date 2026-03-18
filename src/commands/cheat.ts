import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/types'

export const handleCheat = (rawCmd: string, context: GameContext): boolean => {
  const trimmed = rawCmd.trim()

  switch (trimmed) {
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
