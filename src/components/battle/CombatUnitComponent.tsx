import { motion, useAnimation } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { CombatUnit } from '~/core/battle/CombatUnit'
import { useBattleStore } from '~/stores/useBattleStore'

const FALLBACK_SPRITES = {
  idle: ['https://via.placeholder.com/128/444/fff?text=Idle_1', 'https://via.placeholder.com/128/333/fff?text=Idle_2'],
  attack: 'https://via.placeholder.com/128/aa3333/fff?text=Attack',
  hit: 'https://via.placeholder.com/128/ff8800/fff?text=Hit',
  die: 'https://via.placeholder.com/128/000/fff?text=Die',
  escape: 'https://via.placeholder.com/128/555/fff?text=Escape',
}

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
    if (!currentAction) return
    const execute = async () => {
      currentAction.onComplete?.()
    }
    execute()
  }, [currentAction, controls])

  const displayImage = useMemo(() => {
    const s = unit.sprites || {}

    const getValidImage = (primary: string | undefined, fallback: string) => {
      if (!primary || failedPaths.has(primary)) return fallback
      return primary
    }

    if (currentAction) {
      switch (currentAction.type) {
        case 'ATTACK':
          return getValidImage(s.attack, FALLBACK_SPRITES.attack)
        case 'HIT':
          return getValidImage(s.hit, FALLBACK_SPRITES.hit)
        case 'DIE':
          return getValidImage(s.die, FALLBACK_SPRITES.die)
        case 'ESCAPE':
          return getValidImage(s.escape, FALLBACK_SPRITES.escape)
      }
    }

    const primaryIdle = Array.isArray(s.idle) ? s.idle[idleFrame] : undefined
    const fallbackIdle = FALLBACK_SPRITES.idle[idleFrame] || FALLBACK_SPRITES.idle[0]

    return getValidImage(primaryIdle, fallbackIdle)
  }, [currentAction, idleFrame, unit.sprites, failedPaths])

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
    <motion.div animate={controls} className={`relative ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}>
      <img
        src={displayImage}
        alt={unit.name}
        onError={handleImageError}
        className="w-32 h-32 object-contain pixelated"
      />

      <div className={`mt-1 w-full ${isEnemy ? '-scale-x-100' : 'scale-x-100'}`}>
        <div className="text-[12px] font-bold text-white text-center drop-shadow-[1px_1px_2px_rgba(0,0,0,1)] mb-0.5">
          {unit.name}
        </div>

        <div className="w-[100px] mx-auto relative">
          <div className="w-full h-2 bg-[#333] rounded-full border-[1.5px] border-black overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
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

          <div className="text-[9px] text-white text-right mt-0.5 font-mono drop-shadow-[1px_1px_1px_rgba(0,0,0,1)]">
            {Math.ceil(unit.ref.hp)} / {unit.ref.maxHp}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
