import { useCallback } from 'react'
import { useGame } from './useGame'

export const useCombat = () => {
  const { getContext, getPlayer } = useGame()

  const getCorpsesCount = useCallback(() => {
    const context = getContext()
    const player = getPlayer()
    if (!context || !player) return 0

    return context.world.getCorpsesAt(player.pos).length
  }, [getContext, getPlayer])

  const getSortedPlayerSide = useCallback(
    (units: any[]) =>
      [...units].sort((a, b) => {
        if (a.type === 'player' && b.type !== 'player') return -1
        if (a.type !== 'player' && b.type === 'player') return 1

        const weightA = a.orderWeight ?? 0
        const weightB = b.orderWeight ?? 0

        return weightB - weightA
      }),
    []
  )

  const getSortedEnemySide = useCallback((units: any[]) => [...units].reverse(), [])

  return {
    getCorpsesCount,
    getSortedPlayerSide,
    getSortedEnemySide,
  }
}
