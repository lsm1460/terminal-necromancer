import React, { useMemo } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'

export const StatusBar: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const logs = useGameStore((state) => state.logs)
  const status = useMemo(() => {
    if (!engine?.current) {
      return null
    }

    const player = engine.current.player || {}
    const { map } = engine.current.context || {}

    return {
      level: player.level,
      hp: player.hp,
      maxHp: player.maxHp,
      gold: player.gold,
      location: map?.currentSceneId,
    }
  }, [engine, logs])

  return (
    <div className="p-2.5 border-primary border-b font-bold text-xs">
      {status ? (
        <>
          <p className="flex gap-5">
            <span>LV. {status.level}</span> |
            <span>
              HP: {status.hp.toLocaleString()}/{status.maxHp.toLocaleString()}
            </span>{' '}
            |<span>GOLD: {status.gold.toLocaleString()} G</span>
          </p>
        </>
      ) : (
        <span>Initializing System...</span>
      )}
    </div>
  )
}
