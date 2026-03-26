import { motion, useAnimation } from 'framer-motion'
import React, { useEffect } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'

export const UnitIcon: React.FC<{
  unit: CombatUnit
  isEnemy: boolean
}> = ({ unit, isEnemy }) => {
  const currentAction = useBattleStore((state) => state.unitActions[unit.id])

  const controls = useAnimation()

  useEffect(() => {
    if (!currentAction) {
      return
    }

    let isCancelled = false

    const execute = async () => {
      controls.stop()

      try {
        switch (currentAction.type) {
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
    <motion.span animate={controls} className="flex flex-col items-center relative">
      {isEnemy? 'M' : 'P'}
    </motion.span>
  )
}
