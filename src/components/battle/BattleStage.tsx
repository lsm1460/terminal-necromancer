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
    <div className="battle-stage">
      <div className="side player-side">
        {playerSide.map((unit) => (
          <CombatUnitComponent key={unit.id} unit={unit} />
        ))}
      </div>

      <div className="side enemy-side">
        {enemiesSide.map((unit) => (
          <CombatUnitComponent key={unit.id} unit={unit} isEnemy />
        ))}
      </div>
    </div>
  )
}
