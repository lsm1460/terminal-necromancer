import { motion, useAnimation } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'

interface CombatUnitProps {
  unit: CombatUnit
  isEnemy?: boolean
}

export const CombatUnitComponent: React.FC<CombatUnitProps> = ({ unit, isEnemy = false }) => {
  const controls = useAnimation()
  const currentAction = useBattleStore((state) => state.unitActions[unit.id])
  const [idleFrame, setIdleFrame] = useState(0)

  const [failedPaths, setFailedPaths] = useState<Set<string>>(new Set())

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
      // 1. 새로운 애니메이션 시작 전 이전 동작 즉시 중단 및 위치 초기화
      controls.stop()

      try {
        switch (currentAction.type) {
          case 'ATTACK':
            // 앞으로 돌진 후 잠시 대기했다가 복귀
            await controls.start({
              x: isEnemy ? -100 : 100,
              transition: { duration: 0.15, ease: 'easeOut' },
            })
            await new Promise((resolve) => setTimeout(resolve, 100))
            await controls.start({
              x: 0,
              transition: { duration: 0.2, ease: 'anticipate' },
            })
            break

          case 'HIT':
            // 뒤로 툭 밀렸다가 빠르게 제자리로 돌아오며 흔들림
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
            // 도스 게임 느낌으로 깜빡거리며 사라짐
            await controls.start({
              opacity: [1, 0, 1, 0, 0],
              transition: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 1] },
            })
            break

          case 'ESCAPE':
            // 뒤로 빠르게 사라짐
            await controls.start({
              x: isEnemy ? 150 : -150,
              transition: { duration: 0.4, ease: 'easeIn' },
            })
            break

          default:
            break
        }

        // 2. 모든 애니메이션 시퀀스가 끝난 후 1000ms 대기
        if (!isCancelled) {
          setTimeout(() => {
            if (!isCancelled) {
              currentAction.onComplete?.()
            }
          }, 1000)
        }
      } catch (error) {
        // 애니메이션 도중 controls.stop() 등으로 인한 에러 발생 시 처리
        console.error('Animation interrupted', error)
      }
    }

    execute()

    // 3. Cleanup 함수: 액션이 도중에 바뀌면 이전 setTimeout과 로직 무효화
    return () => {
      isCancelled = true
    }
  }, [currentAction, controls, isEnemy])

  const displayImage = useMemo(() => {
    // const s = unit.sprites || {}

    // const getValidImage = (primary: string | undefined, fallback: string) => {
    //   if (!primary || failedPaths.has(primary)) return fallback
    //   return primary
    // }

    // if (currentAction) {
    //   switch (currentAction.type) {
    //     case 'ATTACK':
    //       return getValidImage(s.attack, FALLBACK_SPRITES.attack)
    //     case 'HIT':
    //       return getValidImage(s.hit, FALLBACK_SPRITES.hit)
    //     case 'DIE':
    //       return getValidImage(s.die, FALLBACK_SPRITES.die)
    //     case 'ESCAPE':
    //       return getValidImage(s.escape, FALLBACK_SPRITES.escape)
    //   }
    // }

    // const primaryIdle = Array.isArray(s.idle) ? s.idle[idleFrame] : undefined
    // const fallbackIdle = FALLBACK_SPRITES.idle[idleFrame] || FALLBACK_SPRITES.idle[0]

    // return getValidImage(primaryIdle, fallbackIdle)

    return unit.name
  }, [currentAction, idleFrame, unit, failedPaths])

  const handleImageError = () => {
    setFailedPaths((prev) => new Set(prev).add(displayImage))
  }

  const hpPercentage = Math.max(0, (unit.ref.hp / unit.ref.maxHp) * 100)

  const getHpColor = () => {
    if (hpPercentage > 50) return '#4caf50' // 녹색
    if (hpPercentage > 20) return '#ffeb3b' // 황색
    return '#f44336' // 적색
  }

  return (
    <motion.div
      tabIndex={0}
      animate={controls}
      className="group relative flex flex-col items-center transition-all duration-200 hover:scale-110 hover:z-30 focus:scale-110 focus:z-30 outline-none cursor-pointer"
    >
      <div className="w-20 h-28 border border-dashed border-cyan-700 flex items-center justify-center bg-black/60 group-hover:border-cyan-400 group-focus:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
        <span
          className={`text-xs drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}
        >
          {displayImage}
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

  // return (
  //   <motion.div animate={controls} className={`relative ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}>
  //     <img
  //       src={displayImage}
  //       alt={unit.name}
  //       onError={handleImageError}
  //       className="w-32 h-32 object-contain pixelated"
  //     />

  //     <div className={`mt-1 w-full ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}>
  //       <div className="text-[12px] font-bold text-white text-center drop-shadow-[1px_1px_2px_rgba(0,0,0,1)] mb-0.5">
  //         {unit.name}
  //       </div>

  //       <div className="w-[100px] mx-auto relative">
  //         <div className="w-full h-2 bg-[#333] rounded-full border-[1.5px] border-black overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
  //           <motion.div
  //             initial={false}
  //             animate={{
  //               width: `${hpPercentage}%`,
  //               backgroundColor: getHpColor(),
  //             }}
  //             transition={{ duration: 0.5, ease: 'easeOut' }}
  //             className="h-full rounded-sm"
  //           />
  //         </div>

  //         <div className="text-[9px] text-white text-right mt-0.5 font-mono drop-shadow-[1px_1px_1px_rgba(0,0,0,1)]">
  //           {Math.ceil(unit.ref.hp)} / {unit.ref.maxHp}
  //         </div>
  //       </div>
  //     </div>
  //   </motion.div>
  // )
}
