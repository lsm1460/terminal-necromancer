import React from 'react'
import { useGameStore } from '~/stores/useGameStore'

export const StatusBar: React.FC = () => {
  const status = useGameStore((state) => state.status)

  return (
    <div className="p-2.5 border-primary border-b flex gap-5 font-bold">
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
