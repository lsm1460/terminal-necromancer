import { CombatUnit } from './CombatUnit'
import { BattleState, BattleHooks, BattleResult } from './types'
import { delay } from '~/utils'

export interface BattleManager {
  getAliveUnits(): CombatUnit[]
  getTurnOrder(): CombatUnit[]
  handleUnitTurn(unit: CombatUnit): Promise<boolean | void> // returns true if battle should end (e.g. escape)
  isBattleOver(): boolean
  getBattleResult(): BattleResult
}

export class BattleEngine {
  private state: BattleState = BattleState.READY
  private round: number = 0

  constructor(
    private manager: BattleManager,
    private hooks: BattleHooks = {}
  ) {}

  public getState(): BattleState {
    return this.state
  }

  public async start(): Promise<BattleResult> {
    if (this.state !== BattleState.READY) {
      throw new Error('Battle is already in progress or finished')
    }

    this.state = BattleState.IN_PROGRESS
    this.round = 0

    while (!this.manager.isBattleOver() && this.state === BattleState.IN_PROGRESS) {
      this.round++
      await this.runRound()
    }

    this.state = BattleState.FINISHED
    const result = this.manager.getBattleResult()
    
    if (this.hooks.onBattleEnd) {
      await this.hooks.onBattleEnd(result)
    }

    return result
  }

  private async runRound() {
    if (this.hooks.onRoundStart) {
      await this.hooks.onRoundStart(this.round)
    }

    const turnOrder = this.manager.getTurnOrder()

    for (const unit of turnOrder) {
      if (!unit.ref.isAlive) continue
      if (this.manager.isBattleOver()) break

      if (this.hooks.onTurnStart) {
        await this.hooks.onTurnStart(unit)
      }

      const shouldEnd = await this.manager.handleUnitTurn(unit)
      
      if (this.hooks.onTurnEnd) {
        await this.hooks.onTurnEnd(unit)
      }

      if (shouldEnd === true) {
        this.state = BattleState.FINISHED
        break
      }

      await delay()
    }

    if (this.hooks.onRoundEnd) {
      await this.hooks.onRoundEnd(this.round)
    }
  }
}
