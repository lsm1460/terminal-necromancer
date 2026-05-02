import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BattleDirector } from '~/core/battle/BattleDirector'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { useCombat } from '~/hooks/useCombat'
import { WebBattleRenderer } from '~/renderers/BattleRenderer'
import { useBattleStore } from '~/stores/useBattleStore'
import { useGameStore } from '~/stores/useGameStore'
import { CombatUnitComponent } from './CombatUnitComponent'
import { UnitState } from './UnitState'

export const BattleStage: React.FC = () => {
  const { t } = useTranslation()
  const logs = useGameStore((state) => state.logs)
  const { getCorpsesCount, getSortedPlayerSide, getSortedEnemySide } = useCombat()
  const { inBattle, playerSide: originPlayerSide, enemiesSide: originEnemiesSide } = useBattleStore()

  const [corpsesCount, setCorpsesCount] = useState(0)
  const [focusedUnit, setFocusedUnit] = useState<{ unit: CombatUnit; isEnemy: boolean } | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const BASE_WIDTH = 800
  const BASE_HEIGHT = 350

  useEffect(() => {
    if (!parentRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect

        const targetWidth = width * 0.95
        const targetHeight = height * 0.95

        const scaleX = targetWidth / BASE_WIDTH
        const scaleY = targetHeight / BASE_HEIGHT

        const newScale = Math.min(scaleX, scaleY, 1)
        setScale(newScale)
      }
    })

    observer.observe(parentRef.current)

    return () => observer.disconnect()
  }, [BASE_WIDTH, BASE_HEIGHT])

  useEffect(() => {
    const renderer = new WebBattleRenderer()
    BattleDirector.setRenderer(renderer)
  }, [])

  useEffect(() => {
    setCorpsesCount(getCorpsesCount())
  }, [logs, getCorpsesCount])

  useEffect(() => {
    const handleGlobalClick = () => {
      setFocusedUnit(null)
    }

    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  const playerSide: CombatUnit[] = useMemo(
    () => getSortedPlayerSide(originPlayerSide),
    [originPlayerSide, getSortedPlayerSide]
  )

  const enemiesSide: CombatUnit[] = useMemo(
    () => getSortedEnemySide(originEnemiesSide),
    [originEnemiesSide, getSortedEnemySide]
  )

  return (
    <div
      ref={parentRef}
      className="absolute w-full h-full min-h-[400px] flex flex-col items-center overflow-hidden pointer-events-none pt-4"
    >
      {inBattle && (
        <div
          className="pointer-events-auto border border-primary bg-black/50 backdrop-blur-[3px] font-mono text-primary shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          style={{
            width: `${BASE_WIDTH}px`,
            height: `${BASE_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            flexShrink: 0,
          }}
        >
          {/* 헤더 섹션 */}
          <div className="flex justify-between items-center border-b border-primary px-4 py-2 bg-cyan-950/50 text-[12px] tracking-tighter">
            <span>:: BATTLE_ENGAGEMENT ::</span>
            <span className="animate-pulse text-cyan-400">SYSTEM_READY</span>
          </div>

          {/* 메인 전투 구역 */}
          <div className="relative h-[calc(100%-80px)] flex justify-between items-center pt-16">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]"></div>

            {focusedUnit && (
              <div
                className="absolute top-4 z-[100] w-[200px]"
                style={{
                  left: focusedUnit.isEnemy ? '1rem' : 'auto',
                  right: focusedUnit.isEnemy ? 'auto' : '1rem',
                  transform: `scale(${1 / scale})`,
                  transformOrigin: focusedUnit.isEnemy ? 'top left' : 'top right',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <UnitState unit={focusedUnit.unit} />
              </div>
            )}

            <Side units={playerSide} focusedUnit={focusedUnit} setFocusedUnit={setFocusedUnit} />

            <div className="text-primary text-xl font-black italic opacity-30 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              - VS -
            </div>

            <Side units={enemiesSide} focusedUnit={focusedUnit} setFocusedUnit={setFocusedUnit} isEnemy />
          </div>

          {/* 푸터 섹션 (시체 수) */}
          <div
            className="absolute bottom-0 w-full px-2 pb-2"
            style={{
              transform: `scale(${1 / scale})`,
              transformOrigin: 'bottom left', // 우측 하단 기준으로 커지게 설정
              width: `${100 * scale}%`, // 역스케일로 인해 넓어진 가로폭 보정
            }}
          >
            <p className="text-right text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
              {t('web.corpses_count', { count: corpsesCount })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const Side: React.FC<{
  units: CombatUnit[]
  isEnemy?: boolean
  focusedUnit: { unit: CombatUnit; isEnemy: boolean } | null
  setFocusedUnit: React.Dispatch<React.SetStateAction<{ unit: CombatUnit; isEnemy: boolean } | null>>
}> = ({ units, isEnemy = false, focusedUnit, setFocusedUnit }) => {
  const unitActions = useBattleStore((state) => state.unitActions)
  const OFFSET_STEP = 16

  const hasAnyActiveAction = Object.values(unitActions).some((action) => action.type !== 'IDLE')

  return (
    <div
      className={`
        grid w-1/2
        grid-cols-[repeat(4,50px)] 
        grid-rows-[repeat(auto-fill,25px)]
      `}
      style={{
        transform: isEnemy ? 'scaleX(-1)' : 'none',
      }}
    >
      {units.map((unit, i) => {
        const action = unitActions[unit.id]
        const isActing = action && action.type !== 'IDLE'

        let isFocus: boolean | undefined = isActing || (focusedUnit ? focusedUnit.unit.id === unit.id : false)
        if (!hasAnyActiveAction && focusedUnit === null) {
          isFocus = undefined
        }

        const rowIndex = Math.floor(i / 4)
        const stepOffset = rowIndex * OFFSET_STEP

        return (
          <div
            key={unit.id}
            className="relative w-[50px] h-[25px] pointer-events-none"
            style={{ zIndex: rowIndex * 10 + (isFocus === true ? 100 : 0) - i }}
          >
            <div
              className="w-[250%] aspect-square absolute left-0 bottom-0 pointer-events-none"
              style={{
                transform: `translateX(${stepOffset}px) ${isEnemy ? 'scaleX(-1)' : ''}`,
              }}
            >
              <CombatUnitComponent unit={unit} isFocus={isFocus} isEnemy={isEnemy} setFocusedUnit={setFocusedUnit} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
