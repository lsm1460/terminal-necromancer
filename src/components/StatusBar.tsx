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
    <div className="p-2.5 border-primary border-b flex gap-5 font-bold text-xs">
      {status ? (
        <>
          <span>LV. {status.level}</span> |
          <span>
            HP: {status.hp}/{status.maxHp}
          </span>{' '}
          |<span>GOLD: {status.gold}</span> |<span>LOC: {status.location}</span>
        </>
      ) : (
        <span>Initializing System...</span>
      )}
    </div>
  )
}
