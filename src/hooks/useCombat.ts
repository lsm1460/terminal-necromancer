import { useCallback } from 'react'
import chain from 'lodash/chain'
import { useGame } from './useGame'

export const useCombat = () => {
  const { getContext, getPlayer } = useGame()

  const getCorpsesCount = useCallback(() => {
    const context = getContext()
    const player = getPlayer()
    if (!context || !player) return 0

    return context.world.getCorpsesAt(player.x, player.y).length
  }, [getContext, getPlayer])

  const getSortedPlayerSide = useCallback((units: any[]) => {
    return chain(units)
      .sortBy((unit) => (unit.type === 'player' ? Infinity : 0))
      .reverse()
      .value()
  }, [])

  return {
    getCorpsesCount,
    getSortedPlayerSide,
  }
}
