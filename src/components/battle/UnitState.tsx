import React, { useMemo } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { AnsiHtml } from '../Ansi'

export const UnitState: React.FC<{
  unit: CombatUnit
  isEnemy: boolean
}> = ({ unit, isEnemy }) => {
  const hpPercentage = Math.max(0, (unit.ref.hp / unit.ref.maxHp) * 100)

  // HP 색상 로직은 그대로 유지
  const getHpColor = () => {
    if (hpPercentage > 50) return '#4caf50'
    if (hpPercentage > 20) return '#ffeb3b'
    return '#f44336'
  }

  const hasStatus = unit.buff.length > 0 || unit.deBuff.length > 0

  const description = useMemo(() => unit.ref.description, [unit])

  return (
    <div
      className={`
        absolute top-5 w-2xs backdrop-blur-md hidden group-focus:block border border-primary pointer-events-none z-50 bg-black/80
        after:content-[''] after:absolute after:top-2 after:w-3 after:h-3 after:bg-grey-800 after:border-l after:border-t after:border-primary
        ${isEnemy ? 'after:-right-[7px] after:rotate-[135deg]' : 'after:-left-[7px] after:rotate-[-45deg]'}
      `}
      style={isEnemy ? { left: -12, transform: 'translateX(-100%)' } : { right: -12, transform: 'translateX(100%)' }}
    >
      <div className="border-b border-primary p-1 bg-grey-800">
        <AnsiHtml message={unit.name} className="text-xs font-bold relative z-10" />
      </div>

      <div className="p-2 space-y-1">
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>HP</span>
          <span>
            {unit.ref.hp}/{unit.ref.maxHp}
          </span>
        </div>
        <div className="w-full h-1 bg-slate-800 border border-slate-700">
          <div
            className="h-full transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            style={{ width: `${hpPercentage}%`, backgroundColor: getHpColor() }}
          />
        </div>

        {description && (
          <div className="pt-1 border-t border-slate-700/50">
            <p className="text-[10px] leading-relaxed text-slate-300 break-all whitespace-pre-wrap">{description}</p>
          </div>
        )}
      </div>

      {hasStatus && (
        <div className="border-t border-primary/30 p-1.5 bg-black/40 flex flex-wrap gap-1">
          {unit.buff.map((b, i) => (
            <span key={`buff-${i}`} className="text-xs text-green-400 font-mono">
              [{b.name}:{b.duration}턴 남음]
            </span>
          ))}
          {unit.deBuff.map((d, i) => (
            <span key={`debuff-${i}`} className="text-xs text-red-500 font-mono italic">
              [{d.name}:{d.duration}턴 남음]
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
