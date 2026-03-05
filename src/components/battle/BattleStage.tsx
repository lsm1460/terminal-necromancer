import React, { useEffect } from 'react'
import { BattleDirector } from '~/core/battle/BattleDirector'
import { WebBattleRenderer } from '~/renderers/BattleRenderer'
import { useBattleStore } from '~/stores/useBattleStore'
import { CombatUnitComponent } from './CombatUnitComponent'

export const BattleStage: React.FC = () => {
  const { inBattle, playerSide, enemiesSide } = useBattleStore()

  useEffect(() => {
    const renderer = new WebBattleRenderer()
    BattleDirector.setRenderer(renderer)
  }, [])

  if (!inBattle) {
    return <></>
  }

  return (
    <div className="fixed inset-x-0 top-10 z-50 flex justify-center p-2">
      <div className="w-[95%] max-w-4xl border border-primary bg-black/50 backdrop-blur-[1.5px] font-mono text-primary shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        
        <div className="flex justify-between items-center border-b border-primary px-2 py-1 bg-cyan-950/50 text-[10px] tracking-tighter">
          <span>:: BATTLE_ENGAGEMENT ::</span>
          <span className="animate-pulse">SYSTEM_READY</span>
        </div>

        <div className="relative h-64 flex justify-between items-center px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
          
          <div className="relative flex -space-x-8">
            {playerSide.map((unit, i) => (
              <CombatUnitComponent unit={unit} key={unit.id} />
            ))}
          </div>

          <div className="text-cyan-900 text-[10px] font-black italic opacity-30 select-none">
            - VS -
          </div>

          <div className="relative flex -space-x-8">
            {enemiesSide.map((unit, i) => (
              <CombatUnitComponent unit={unit} key={unit.id} isEnemy/>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
