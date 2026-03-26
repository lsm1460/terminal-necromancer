import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'

interface DamageItem {
  id: number
  val: number
  isCrit: boolean
  type?: 'normal' | 'heal' | 'poison'
}

interface DamageDisplayProps {
  unit: CombatUnit
}

export const DamageDisplay: React.FC<DamageDisplayProps> = ({ unit }) => {
  const currentAction = useBattleStore((state) => state.unitActions[unit.id])

  const [damageList, setDamageList] = useState<DamageItem[]>([])

  useEffect(() => {
    if (currentAction?.options?.damage) {
      const newDamage: DamageItem = {
        id: Date.now() + Math.random(),
        val: currentAction.options.damage,
        isCrit: !!currentAction.options.isCritical,
        type: 'normal', // 기본값, 필요시 확장 가능
      }

      setDamageList((prev) => [...prev, newDamage])

      setTimeout(() => {
        setDamageList((prev) => prev.filter((d) => d.id !== newDamage.id))
      }, 1000)
    }
  }, [currentAction])

  const getStyle = (item: DamageItem) => {
    if (item.type === 'heal') return 'text-green-400 [text-shadow:2px_2px_0_#000]'
    if (item.type === 'poison') return 'text-purple-500 [text-shadow:2px_2px_0_#000]'
    if (item.isCrit) return 'text-yellow-400 text-3xl [text-shadow:2px_2px_0_#000,4px_4px_0_#b91c1c]'
    return 'text-white text-xl [text-shadow:2px_2px_0_#000]'
  }

  return (
    <div className="absolute top-0 pointer-events-none z-50">
      <AnimatePresence>
        {damageList.map((d) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -50,
              scale: d.isCrit ? [1, 1.5, 1.2] : 1,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute left-1/2 -translate-x-1/2 pointer-events-none select-none font-black flex flex-col items-center ${getStyle(d)}`}
          >
            {d.isCrit && <span className="text-xs italic tracking-tighter mb-[-4px] animate-pulse">CRITICAL!</span>}
            <span className="font-mono">
              {d.type === 'heal' ? `+${d.val}` : d.val}
              {d.isCrit && '!!'}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
