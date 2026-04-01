import { useCallback } from 'react'
import { useGame } from './useGame'

export const useCombat = () => {
  const { getContext, getPlayer } = useGame()

  const getCorpsesCount = useCallback(() => {
    const context = getContext()
    const player = getPlayer()
    if (!context || !player) return 0

    return context.world.getCorpsesAt(player.x, player.y).length
  }, [getContext, getPlayer])

  const getSortedPlayerSide = useCallback(
    (units: any[]) => [...units].sort((a, b) => (b.type === 'player' ? 1 : 0) - (a.type === 'player' ? 1 : 0)),
    []
  )

  return {
    getCorpsesCount,
    getSortedPlayerSide,
  }
}
