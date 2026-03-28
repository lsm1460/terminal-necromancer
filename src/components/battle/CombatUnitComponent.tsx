import React, { useEffect, useRef, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { DamageDisplay } from './DamageDisplay'
import { UnitState } from './UnitState'
import { UnitIcon } from './UnitIcon'

interface CombatUnitProps {
  unit: CombatUnit
  zIndex: number
  isEnemy?: boolean
}

export const CombatUnitComponent: React.FC<CombatUnitProps> = ({ unit, zIndex, isEnemy = false }) => {
  const [isFocus, setIsFocus] = useState(false)

  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (wrapperRef.current && !(wrapperRef.current as HTMLDivElement).contains(event.target as HTMLElement)) {
        setIsFocus(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div
      ref={wrapperRef}
      className="group flex flex-col items-center outline-none cursor-pointer"
      style={{
        zIndex: isFocus ? 100 : zIndex,
      }}
      onClick={() => setIsFocus(true)}
    >
      <DamageDisplay unit={unit} />

      <div
        className=" transition-transform duration-200"
        style={{
          transform: isFocus ? 'scale(1.5)' : 'scale(1)',
          opacity: isFocus ? 1 : 0.8,
        }}
      >
        <UnitIcon unit={unit} isEnemy={isEnemy} />
        {isFocus && (
          <div className="absolute left-1/2 w-px h-20 bg-primary -bottom-1 translate-y-full pointer-events-none" />
        )}
      </div>
      {isFocus && <UnitState unit={unit} isEnemy={isEnemy} />}
    </div>
  )
}
