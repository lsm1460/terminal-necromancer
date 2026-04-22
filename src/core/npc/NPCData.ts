import { NPCState } from '../types'

export class NPCData {
  protected _baseData: Record<string, any>
  protected _states: Record<string, NPCState> = {}

  constructor(npcData: any, savedData?: any) {
    this._baseData = npcData

    // 저장된 데이터가 있다면 복구, 없으면 초기화
    if (savedData?.states) {
      this._states = savedData.states
    }
    this.initializeStates()
  }

  private initializeStates() {
    Object.entries(this._baseData).forEach(([id, data]) => {
      if (this._states[id]) return

      this._states[id] = {
        hp: data.hp ?? data.maxHp ?? 100,
        isAlive: data.isAlive ?? true,
        reborn: data.reborn ?? false,
        relation: 0,
      }
    })
  }

  public getBase(id: string) {
    return this._baseData[id]
  }

  public getState(id: string) {
    return this._states[id]
  }

  public setAlive(id: string, alive: boolean) {
    if (this._states[id]) {
      this._states[id].isAlive = alive
    }
  }

  public setReborn(id: string, reborn: boolean) {
    if (this._states[id]) {
      this._states[id].reborn = reborn
    }
  }

  public getSaveData() {
    return {
      states: this._states,
    }
  }
}
