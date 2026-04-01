import { Settings } from 'lucide-react'
import React, { useMemo } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { ThemedButton } from './common/ThemedButton'
import { useGame } from '~/hooks/useGame'

export const StatusBar: React.FC = () => {
  const { getPlayer, getContext } = useGame()
  const { logs, toggleConfigMenu } = useGameStore((state) => state)
  const status = useMemo(() => {
    const player = getPlayer()
    const context = getContext()

    if (!player || !context) {
      return null
    }

    const { map } = context

    return {
      level: player.level,
      hp: player.hp,
      maxHp: player.maxHp,
      gold: player.gold,
      location: map?.currentSceneId,
    }
  }, [getPlayer, getContext, logs])

  return (
    <div className="h-10 px-2.5 border-primary/30 border-b font-bold text-xs flex items-center">
      {status ? (
        <>
          <p className="flex gap-5">
            <span>LV. {status.level}</span> |
            <span>
              HP: {status.hp.toLocaleString()}/{status.maxHp.toLocaleString()}
            </span>{' '}
            |<span>GOLD: {status.gold.toLocaleString()} G</span>
          </p>
          <ThemedButton.round className="ml-auto bg-transparent" onClick={toggleConfigMenu}>
            <Settings size={20} />
          </ThemedButton.round>
        </>
      ) : (
        <span>Initializing System...</span>
      )}
    </div>
  )
}
