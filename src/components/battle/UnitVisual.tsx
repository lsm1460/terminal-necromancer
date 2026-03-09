import { motion } from 'framer-motion'
import React from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { AnsiHtml } from '../Ansi'

export const UnitVisual: React.FC<{
  unit: CombatUnit
  controls: any
  isEnemy: boolean
  displayImage: string | undefined
}> = ({ unit, controls, isEnemy, displayImage }) => {
  const hpPercentage = Math.max(0, (unit.ref.hp / unit.ref.maxHp) * 100)

  const getHpColor = () => {
    if (hpPercentage > 50) return '#4caf50' // 녹색
    if (hpPercentage > 20) return '#ffeb3b' // 황색
    return '#f44336' // 적색
  }

  return (
    <motion.div animate={controls} className="flex flex-col items-center">
      <div className="w-20 h-28 border border-dashed border-cyan-700 flex items-center justify-center bg-black/80 group-hover:bg-gray-900 group-hover:border-cyan-400 group-focus:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
        <img
          src={displayImage}
          alt={unit.name}
          className={`w-32 h-32 object-contain pixelated ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}
        />
        <span
          className={`absolute left-1/2 top-1 -translate-x-1/2 w-full text-xs drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] text-center px-1 opacity-80`}
        >
          <AnsiHtml message={unit.name} />
        </span>
      </div>
      <div className="w-16 h-1 mt-1 bg-slate-900 border border-cyan-900 overflow-hidden">
        <motion.div
          initial={false}
          animate={{
            width: `${hpPercentage}%`,
            backgroundColor: getHpColor(),
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-sm"
        />
      </div>
    </motion.div>
  )
}
