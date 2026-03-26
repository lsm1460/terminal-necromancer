import _ from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { BattleDirector } from '~/core/battle/BattleDirector'
import { GameEngine } from '~/gameEngine'
import { WebBattleRenderer } from '~/renderers/BattleRenderer'
import { useBattleStore } from '~/stores/useBattleStore'
import { useGameStore } from '~/stores/useGameStore'
import { CombatUnitComponent } from './CombatUnitComponent'
import { useTranslation } from 'react-i18next'

export const BattleStage: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const { t } = useTranslation()
  const logs = useGameStore((state) => state.logs)
  const { inBattle, playerSide: originPlayerSide, enemiesSide } = useBattleStore()

  const [corpsesCount, setCorpsesCount] = useState(0)

  useEffect(() => {
    const renderer = new WebBattleRenderer()
    BattleDirector.setRenderer(renderer)
  }, [])

  useEffect(() => {
    const _engine = engine.current

    if (_engine && _engine.context) {
      const { x, y } = _engine.player

      const { world } = _engine.context

      const corpses = world.getCorpsesAt(x, y)

      setCorpsesCount(corpses.length)
    }
  }, [logs, engine])

  const playerSide = useMemo(
    () =>
      _.chain(originPlayerSide)
        .sortBy((unit) => {
          if (unit.type === 'player') return Infinity
          return _.findIndex(originPlayerSide, { id: unit.id })
        })
        .reverse()
        .value(),
    [originPlayerSide]
  )

  if (!inBattle) {
    return <></>
  }

  return (
    <div className="absolute inset-x-0 top-5 z-50 flex justify-center p-2 xl:top-10">
      <div className="w-[95%] max-w-4xl border border-primary bg-black/50 backdrop-blur-[1.5px] font-mono text-primary shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div className="flex justify-between items-center border-b border-primary px-2 py-1 bg-cyan-950/50 text-[10px] tracking-tighter">
          <span>:: BATTLE_ENGAGEMENT ::</span>
          <span className="animate-pulse">SYSTEM_READY</span>
        </div>

        <div className="relative flex justify-between items-center px-4 py-5">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]"></div>

          <div className="flex flex-wrap flex-1">
            {playerSide.map((unit, i) => (
              <CombatUnitComponent unit={unit} key={unit.id} zIndex={playerSide.length - i} />
            ))}
          </div>

          <div className="text-primary text-xs font-black italic opacity-50 select-none">- VS -</div>

          <div className="flex flex-wrap flex-1 ">
            {enemiesSide.map((unit, i) => (
              <CombatUnitComponent unit={unit} key={unit.id} isEnemy zIndex={i + 10} />
            ))}
          </div>
        </div>
        <div className="px-2 pb-1">
          <p className="text-right text-[10px]">{t('web.corpses_count', { count: corpsesCount })}</p>
        </div>
      </div>
    </div>
  )
}
