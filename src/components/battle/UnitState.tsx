import React from 'react'
import { useTranslation } from 'react-i18next'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { getHpColor } from '~/utils'
import { AnsiHtml } from '../Ansi'

export const UnitState: React.FC<{
  unit: CombatUnit
  isEnemy: boolean
}> = ({ unit, isEnemy }) => {
  const { t } = useTranslation()
  const hpPercentage = Math.max(0, (unit.ref.hp / unit.ref.maxHp) * 100)

  const hasBuff = unit.buff.length > 0 || unit.deBuff.length > 0

  const evaRate = Math.floor((unit.ref.eva || 0) * 100)
  const critRate = Math.floor((unit.ref.crit || 0) * 100)

  return (
    <div
      className={`
    absolute w-2xs backdrop-blur-md border border-primary pointer-events-none z-50 bg-black/80
    top-full mt-3 
    after:content-[''] after:absolute after:-top-[7px] after:w-3 after:h-3 after:bg-grey-800 after:border-l after:border-t after:border-primary after:rotate-45
    ${
      isEnemy
        ? 'right-0 after:right-3 xl:after:right-8' // 적군: 말풍선이 왼쪽에 치우쳐 보인다면 우측 정렬 및 꼬리 우측
        : 'left-0 after:left-3 xl:after:left-8' // 아군: 말풍선이 오른쪽에 치우쳐 보인다면 좌측 정렬 및 꼬리 좌측
    }
  `}
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
            style={{ width: `${hpPercentage}%`, backgroundColor: getHpColor(hpPercentage) }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-slate-700/30 pt-1.5 font-mono text-[10px]">
          <div className="flex justify-between border-b border-slate-800 pb-0.5">
            <span className="text-slate-500 uppercase">{t('stat.atk')}</span>
            <span className="text-orange-400 font-bold">{unit.ref.atk}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-0.5">
            <span className="text-slate-500 uppercase">{t('stat.def')}</span>
            <span className="text-blue-400 font-bold">{unit.ref.def}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 uppercase">{t('stat.eva')}</span>
            <span className="text-emerald-400">{evaRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 uppercase">{t('stat.crit')}</span>
            <span className="text-red-400">{critRate}%</span>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-700/50">
          <p className="text-[10px] leading-relaxed text-slate-300 break-keep whitespace-pre-wrap">
            {unit.ref.description}
          </p>
        </div>
      </div>

      {hasBuff && (
        <div className="border-t border-primary/30 p-1.5 bg-black/40 flex flex-wrap gap-1">
          {unit.buff.map((b, i) => (
            <span key={`buff-${i}`} className="text-xs text-green-400 font-mono">
              {t('battle.status.remaining_turns', {
                name: b.name,
                duration: b.duration,
              })}
            </span>
          ))}
          {unit.deBuff.map((d, i) => (
            <span key={`debuff-${i}`} className="text-xs text-red-500 font-mono italic">
              {t('battle.status.remaining_turns', {
                name: d.name,
                duration: d.duration,
              })}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
