import React, { useEffect, useMemo, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'
import { AnsiHtml } from '../Ansi'

export const UnitVisual: React.FC<{
  unit: CombatUnit
  isEnemy: boolean
}> = ({ unit, isEnemy }) => {
  const currentAction = useBattleStore((state) => state.unitActions[unit.id])

  const [idleFrame, setIdleFrame] = useState(0)

  useEffect(() => {
    if (currentAction) return
    const timer = setInterval(() => setIdleFrame((prev) => (prev === 0 ? 1 : 0)), 600)
    return () => clearInterval(timer)
  }, [currentAction])

  const displayImage = useMemo(() => {
    const s = unit.sprites

    if (!s) {
      const type = currentAction?.type?.toLowerCase() || 'idle'
      return `/src/assets/default_${type}.png`
    }

    if (currentAction) {
      switch (currentAction.type) {
        case 'ATTACK':
          return s.attack?.src
        case 'HIT':
          return s.hit?.src
        case 'DIE':
          return s.die?.src
      }
    }

    const primaryIdle = Array.isArray(s.idle) ? s.idle[idleFrame] : undefined

    return primaryIdle?.src
  }, [currentAction, idleFrame, unit])


  return (
    <div className="flex flex-col items-center relative">
      <div className="max-w-full aspect-square border border-dashed border-cyan-700 flex items-center justify-center bg-black/80">
        <img
          src={displayImage}
          alt={unit.name}
          className={`w-32 h-32 object-contain pixelated ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}
        />
      </div>
    </div>
  )
}
