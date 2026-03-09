import { useAnimation } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'
import { DamageDisplay } from './DamageDisplay'
import { UnitState } from './UnitState'
import { UnitVisual } from './UnitVisual'

interface CombatUnitProps {
  unit: CombatUnit
  zIndex: number
  isEnemy?: boolean
}

export const CombatUnitComponent: React.FC<CombatUnitProps> = ({ unit, zIndex, isEnemy = false }) => {
  const controls = useAnimation()
  const currentAction = useBattleStore((state) => state.unitActions[unit.id])

  const [isFocus, setIsFocus] = useState(false)
  const [idleFrame, setIdleFrame] = useState(0)
  const [damageList, setDamageList] = useState<{ id: number; val: number; isCrit: boolean }[]>([])

  useEffect(() => {
    if (currentAction) return
    const timer = setInterval(() => setIdleFrame((prev) => (prev === 0 ? 1 : 0)), 600)
    return () => clearInterval(timer)
  }, [currentAction])

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

  useEffect(() => {
    if (currentAction?.options?.damage) {
      const newDamage = {
        id: Date.now() + Math.random(),
        val: currentAction.options.damage,
        isCrit: !!currentAction.options.isCritical,
      }

      setDamageList((prev) => [...prev, newDamage])

      setTimeout(() => {
        setDamageList((prev) => prev.filter((d) => d.id !== newDamage.id))
      }, 1000)
    }
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
        case 'ESCAPE':
          return s.escape?.src
      }
    }

    const primaryIdle = Array.isArray(s.idle) ? s.idle[idleFrame] : undefined

    return primaryIdle?.src
  }, [currentAction, idleFrame, unit])

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
      className="group relative flex flex-col items-center hover:z-30! focus:z-30! focus:scale-110! outline-none cursor-pointer"
      style={{ zIndex }}
      onClick={() => setIsFocus(true)}
    >
      <div className="absolute top-0 pointer-events-none z-50">
        {damageList.map((d) => (
          <DamageDisplay key={d.id} damage={d.val} isCritical={d.isCrit} />
        ))}
      </div>

      <UnitVisual unit={unit} controls={controls} isEnemy={isEnemy} displayImage={displayImage}>
        {isFocus && <UnitState unit={unit} isEnemy={isEnemy} />}
      </UnitVisual>
    </div>
  )
}
