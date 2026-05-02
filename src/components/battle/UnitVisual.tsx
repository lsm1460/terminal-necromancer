import { motion, useAnimation } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'
import { getHpColor } from '~/utils'

export const UnitVisual: React.FC<{
  unit: CombatUnit
  isEnemy: boolean
}> = ({ unit, isEnemy }) => {
  const hpPercentage = Math.max(0, (unit.ref.hp / unit.ref.maxHp) * 100)
  const controls = useAnimation()
  const currentAction = useBattleStore((state) => state.unitActions[unit.id])

  const [idleFrame, setIdleFrame] = useState(0)

  useEffect(() => {
    if (currentAction) return

    const timer = setInterval(() => setIdleFrame((prev) => (prev === 0 ? 1 : 0)), 600)
    return () => clearInterval(timer)
  }, [currentAction])

  const spriteResource = useMemo(() => {
    const s = unit.sprites

    if (!s) {
      const type = currentAction?.type?.toLowerCase() || 'idle'
      return `/images/default_${type}.png`
    }

    if (currentAction) {
      switch (currentAction.type) {
        case 'ATTACK':
          return s.attack?.src
      }
    }

    return s.idle
  }, [currentAction, unit])

  const displayImage = useMemo(() => {
    if (Array.isArray(spriteResource)) {
      return spriteResource[idleFrame]?.src
    }

    return spriteResource
  }, [spriteResource, idleFrame])

  const isAlive = unit.ref.isAlive

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const playUnitAnimation = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    controls.stop()

    if (!currentAction) {
      controls.start({
        x: 0,
        scale: 1,
        opacity: isAlive ? 1 : 0,
        transition: { duration: 0.2 },
      })
      return
    }

    controls.set({ x: 0, scale: 1, opacity: 1 })

    timerRef.current = setTimeout(() => {
      currentAction.onComplete?.()
    }, 1000)

    try {
      switch (currentAction.type) {
        case 'ATTACK':
          await controls.start({
            x: isEnemy ? -100 : 100,
            scale: 1.1,
            transition: { duration: 0.15, ease: 'easeOut' },
          })
          break
        case 'HIT':
          await controls.start({ x: isEnemy ? 15 : -15, transition: { duration: 0.05 } })
          await controls.start({ x: [0, -4, 4, -2, 2, 0], transition: { duration: 0.2 } })
          break
        case 'DIE':
          await controls.start({
            opacity: [1, 0, 1, 0, 0],
            transition: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 1] },
          })
          break
      }

      if (currentAction.type !== 'DIE') {
        controls.start({
          x: 0,
          scale: 1,
          opacity: 1,
          transition: { duration: 0.3 },
        })
      }
    } catch (error) {}
  }

  useEffect(() => {
    playUnitAnimation()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentAction, isEnemy, isAlive])

  return (
    <motion.div animate={controls} className="flex flex-col items-center relative">
      <div className="max-w-full aspect-square flex items-center justify-center relative">
        <div className="w-9 h-1.5 bg-slate-900 border border-cyan-900 overflow-hidden absolute top-2">
          <motion.div
            initial={false}
            animate={{
              width: `${hpPercentage}%`,
              backgroundColor: getHpColor(hpPercentage),
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full"
          />
        </div>
        <img
          src={displayImage}
          alt={unit.name}
          className={`w-32 h-32 object-contain pixelated ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}
          style={{
            opacity: unit.isStealth ? 0.5 : 1,
          }}
        />
      </div>
    </motion.div>
  )
}
