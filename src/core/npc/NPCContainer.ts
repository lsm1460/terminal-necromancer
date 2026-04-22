import { NPCState } from '../types/npc'

export class NPCContainer {
  private baseData: Record<string, any>
  private states: Record<string, NPCState> = {}

  constructor(npcData: any, savedStates?: Record<string, NPCState>) {
    this.baseData = npcData
    this.states = savedStates || {}
    this.initializeStates()
  }

  private initializeStates() {
    Object.entries(this.baseData).forEach(([id, data]) => {
      if (this.states[id]) return

      this.states[id] = {
        hp: data.hp ?? data.maxHp ?? 100,
        isAlive: data.isAlive ?? true,
        reborn: data.reborn ?? false,
        relation: 0,
      }
    })
  }

  public getState(id: string): NPCState | undefined {
    return this.states[id]
  }

  public getBaseData(id: string): any | undefined {
    return this.baseData[id]
  }

  public setAlive(id: string, alive: boolean = true) {
    if (this.states[id]) {
      this.states[id].isAlive = alive
    }
  }

  public setReborn(id: string, reborn: boolean = true) {
    if (this.states[id]) {
      this.states[id].reborn = reborn
    }
  }

  public getStates() {
    return this.states
  }
}
