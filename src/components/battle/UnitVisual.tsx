import { motion, useAnimation } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'

export const UnitVisual: React.FC<{
  unit: CombatUnit
  isEnemy: boolean
}> = ({ unit, isEnemy }) => {
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
        case 'DIE':
          return s.die?.src
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

  useEffect(() => {
    if (!currentAction) {
      return
    }

    let isCancelled = false

    const execute = async () => {
      controls.stop()

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
            await controls.start({
              x: isEnemy ? 15 : -15,
              transition: { duration: 0.05 },
            })
            await controls.start({
              x: [0, -4, 4, -2, 2, 0],
              transition: { duration: 0.2 },
            })
            break

          case 'DIE':
            await controls.start({
              opacity: [1, 0, 1, 0, 0],
              transition: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 1] },
            })
            break

          case 'ESCAPE':
            await controls.start({
              x: isEnemy ? 20 : -20,
              transition: { duration: 0.4, ease: 'easeIn' },
            })
            break

          default:
            break
        }

        if (!isCancelled) {
          setTimeout(() => {
            if (!isCancelled) {
              currentAction.onComplete?.()

              controls.start({
                x: 0,
                scale: 1,
                opacity: 1, // 죽었을 때 투명해진 상태를 복구 (만약 유닛이 재사용된다면 필요)
                transition: { duration: 0, type: false },
              })
            }
          }, 1000)
        }
      } catch (error) {
        console.error('Animation interrupted', error)
      }
    }

    execute()

    return () => {
      isCancelled = true
    }
  }, [currentAction, controls, isEnemy])

  return (
    <motion.div animate={controls} className="flex flex-col items-center relative">
      <div className="max-w-full aspect-square flex items-center justify-center">
        <img
          src={displayImage}
          alt={unit.name}
          className={`w-32 h-32 object-contain pixelated ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}
        />
      </div>
    </motion.div>
  )
}
