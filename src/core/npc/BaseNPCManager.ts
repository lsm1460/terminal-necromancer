import { INpcManager, Tile } from '../types'
import { BaseNPC } from './BaseNPC'
import { NPCData } from './NPCData'

export class BaseNPCManager implements INpcManager {
  constructor(protected readonly data: NPCData) {}

  public getNPC(id: string): any {
    const base = this.data.getBase(id)
    const state = this.data.getState(id)

    if (!base || !state) return null
    if (state.reborn) return null

    // Core에서는 구체적인 로직 없이 기본 NPC 객체만 생성하여 반환
    return new BaseNPC(id, base, state, this)
  }

  public getAliveNPCInTile({ tile }: { tile: Tile }): any[] {
    const ids = [...(tile.npcIds || [])]

    return ids.map((id) => this.getNPC(id)).filter((npc) => npc !== null && npc.isAlive)
  }

  public setAlive(id: string, alive: boolean = true) {
    this.data.setAlive(id, alive)
  }

  public isHostile(id: string): boolean {
    const npc = this.data.getBase(id)
    return !!npc?.isBoss
  }

  public getSaveData() {
    return this.data.getSaveData()
  }

  public triggerDeathHandler(...params: any[]) {}
}
