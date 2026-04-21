import { Drop } from '../item/types'
import { CombatUnit } from './unit/CombatUnit'

export enum BattleState {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export interface BattleResult {
  isVictory: boolean
  isEscaped: boolean
  gold: number
  exp: number
  drops: Drop[]
}

export interface BattleHooks {
  onRoundStart?: (round: number) => Promise<void>
  onRoundEnd?: (round: number) => Promise<void>
  onTurnStart?: (unit: CombatUnit) => Promise<void>
  onTurnEnd?: (unit: CombatUnit) => Promise<void>
  onBattleEnd?: (result: BattleResult) => Promise<void>
}
