import { HOSTILITY_LIMIT } from '~/consts'
import i18n from '~/i18n'
import { getNPCClass } from '~/npc'
import { EventBus } from '~/systems/EventBus'
import { NPC, NPCState, PositionType } from '~/types'
import { GameEventType } from '~/types/event'
import { MapManager } from './MapManager'
import { Terminal } from './Terminal'
import { BaseNPC } from './npc/BaseNPC'

type EventCallback = (npcId: string, params?: { karma?: number; hostile?: number }) => void

export class NPCManager {
  private baseData: Record<string, any>
  private states: Record<string, NPCState> = {}
  private factionHostility: Record<string, number> = {}
  private factionContribution: Record<string, number> = {}

  constructor(
    npcData: any,
    private eventBus: EventBus,
    savedData?: any
  ) {
    this.baseData = npcData

    const hasValidSaveData = savedData && typeof savedData === 'object' && Object.keys(savedData).length > 0

    if (hasValidSaveData) {
      this.states = savedData.states || {}
      this.factionHostility = savedData.factionHostility || {}
      this.factionContribution = savedData.factionContribution || {}
    }

    this.initializeStates()

    eventBus.subscribe(GameEventType.SKILL_RAISE_SKELETON_SUCCESS, this.reborn)
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

  getNPC(id: string): BaseNPC | null {
    const base = this.baseData[id]
    const state = this.states[id]

    if (!base || !state) return null
    if (state.reborn) return null

    const NpcClass = getNPCClass(id)

    return new NpcClass(id, base, state, this)
  }

  getAliveNPCInTile(
    { pos, hasKnight, map }: { pos: PositionType; hasKnight: boolean; map: MapManager },
    options?: { withoutFaction?: string[] }
  ) {
    const tile = map.getTile(pos)
    const ids = [...(tile.npcIds || [])]

    if (hasKnight) {
      ids.push('_knight')
    }

    let _list = ids.map((_id) => this.getNPC(_id)).filter((_npc) => _npc !== null)

    if (options?.withoutFaction) {
      _list = _list.filter((_npc) => !(options.withoutFaction || []).includes(_npc.faction))
    }

    return _list
  }

  setAlive(id: string, alive: boolean = true) {
    if (this.states[id]) {
      this.states[id].isAlive = alive
    }
  }

  reborn = (id: string) => {
    if (this.states[id]) {
      this.states[id].reborn = true
    }
  }

  public updateFactionContribution(faction: string, amount: number) {
    this.factionContribution[faction] = (this.factionContribution[faction] || 0) + amount
  }

  public updateFactionHostility(faction: string, amount: number) {
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      return
    }

    this.factionHostility[faction] = (this.factionHostility[faction] || 0) + amount

    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      this.factionHostility[faction] = HOSTILITY_LIMIT

      const limitMessages = i18n.t('npc.faction.hostility_limit_reached', {
        returnObjects: true,
        faction,
      }) as string[]

      limitMessages.forEach((msg) => Terminal.log(msg))
      return
    }

    if (this.factionHostility[faction] > 0 && amount > 0) {
      Terminal.log(
        i18n.t('npc.faction.hostility_warning', {
          faction,
          current: this.factionHostility[faction],
          limit: HOSTILITY_LIMIT,
        })
      )
    }
  }

  public getFactionContribution(faction: string) {
    return this.factionContribution[faction] || 0
  }

  public getFactionHostility(faction: string) {
    return this.factionHostility[faction] || 0
  }

  public setFactionHostility(faction: string, amount: number) {
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      return
    }

    this.factionHostility[faction] = amount
    this.updateFactionHostility(faction, 0)
  }

  isHostile(id: string): boolean {
    const npc = this.baseData[id]
    if (!npc) return false

    if (npc.isBoss) {
      return true
    }

    if (npc.faction && this.factionHostility[npc.faction]) {
      return this.factionHostility[npc.faction] >= HOSTILITY_LIMIT
    }

    return false
  }

  triggerDeathHandler(npc: NPC, params?: Parameters<EventCallback>[1]) {
    const { hostile = 100, karma } = params || {}

    this.setAlive(npc.id, false)

    if (npc.faction) {
      this.setFactionHostility(npc.faction, hostile)
    }

    this.eventBus.emitAsync(GameEventType.NPC_IS_DEAD, { npcId: npc.id, karma })
  }

  getSaveData() {
    return {
      states: this.states,
      factionHostility: this.factionHostility,
      factionContribution: this.factionContribution,
    }
  }
}
