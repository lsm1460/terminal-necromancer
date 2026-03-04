import React from 'react'
import { useGameStore } from '~/stores/useGameStore'

export const StatusBar: React.FC = () => {
  const status = useGameStore((state) => state.status)

  if (!status) {
    return (
      <div className="status-bar">
        <span>Initializing System...</span>
      </div>
    )
  }

  return (
    <div className="status-bar">
      <span>LV. {status.level}</span> |
      <span>
        HP: {status.hp}/{status.maxHp}
      </span>{' '}
      |<span>GOLD: {status.gold}</span> |<span>LOC: {status.location}</span>
    </div>
  )
}
