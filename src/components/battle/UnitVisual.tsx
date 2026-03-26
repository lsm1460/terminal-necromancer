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
      <div className="w-10 h-14 xl:w-20 xl:h-28 border border-dashed border-cyan-700 flex items-center justify-center bg-black/80 group-hover:bg-grey-800 group-hover:border-cyan-400 group-focus:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
        <img
          src={displayImage}
          alt={unit.name}
          className={`w-32 h-32 object-contain pixelated ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}
        />
        <span
          className={`absolute left-1/2 top-1 -translate-x-1/2 w-full text-[6px] xl:text-xs drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] text-center px-1 opacity-80`}
        >
          <AnsiHtml message={unit.name} />
        </span>
      </div>
    </div>
  )
}
