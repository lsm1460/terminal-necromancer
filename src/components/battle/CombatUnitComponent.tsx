import React, { useRef } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { DamageDisplay } from './DamageDisplay'
import { UnitVisual } from './UnitVisual'

interface CombatUnitProps {
  unit: CombatUnit
  isEnemy?: boolean
  isFocus?: boolean
  setFocusedUnit: React.Dispatch<React.SetStateAction<{ unit: CombatUnit; isEnemy: boolean } | null>>
}

export const CombatUnitComponent: React.FC<CombatUnitProps> = ({ unit, isFocus, isEnemy = false, setFocusedUnit }) => {
  const wrapperRef = useRef(null)

  return (
    <div ref={wrapperRef} className="group flex flex-col items-center outline-none relative pointer-events-none">
      <div
        className="absolute w-10 h-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation()
          setFocusedUnit({ unit, isEnemy })
        }}
      />
      <DamageDisplay unit={unit} />

      <div style={{ opacity: isFocus === false ? 0.3 : 1 }} className="transition-opacity">
        <UnitVisual unit={unit} isEnemy={isEnemy} />
      </div>
    </div>
  )
}
