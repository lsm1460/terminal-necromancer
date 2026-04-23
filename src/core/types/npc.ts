import { BaseNPC } from '../npc/BaseNPC'
import { Tile } from './map'

export interface NPCState {
  hp: number
  isAlive: boolean
  reborn: boolean
  relation: number // 호감도 등 확장용
}

export interface INpcManager<N = BaseNPC> {
  getNPC(id: string): N | null
  getAliveNPCInTile(
    context: { tile: Tile },
    options?: {
      withoutFaction?: string[]
    }
  ): N[]

  // 상태 조작
  setAlive(id: string, alive?: boolean): void
  isHostile(id: string): boolean

  // 데이터 보존
  getSaveData(): any

  triggerDeathHandler(npc: any, params?: any): void
}
