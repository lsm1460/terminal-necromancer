import { HOSTILITY_LIMIT } from '~/consts'
import i18n from '~/i18n'
import npcHandlers from '~/npc'
import { GameContext, NPC, NPCState } from '~/types'
import { Terminal } from './Terminal'
import { Player } from './player/Player'
import { BaseNPC } from './npc/BaseNPC'

type EventCallback = (npcId: string) => void

export class NPCManager {
  private baseData: Record<string, any>
  private states: Record<string, NPCState> = {}
  private factionHostility: Record<string, number> = {}
  private factionContribution: Record<string, number> = {}
  private onDeathHandlers: Record<string, EventCallback> = {}

  constructor(
    npcData: any,
    private player: Player,
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

  public onDeath(npcId: string, callback: EventCallback) {
    this.onDeathHandlers[npcId] = callback
  }

  getNPC(id: string): NPC | null {
    const base = this.baseData[id]
    const state = this.states[id]

    if (!base || !state) return null
    if (state.reborn) return null

    return new BaseNPC(id, base, state, this, this.player)
  }

  setAlive(id: string, alive: boolean = true) {
    if (this.states[id]) {
      this.states[id].isAlive = alive
    }
  }

  reborn(id: string) {
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

  public triggerDeathHandler(npcId: string) {
    this.onDeathHandlers[npcId]?.(npcId)
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

  static getNpcScripts(npc: NPC, greetings: 'greeting' | 'farewell') {
    const hostility = npc.faction === 'resistance' ? npc.factionHostility : (npc.relation || 0) * -1

    let dialect: 'friendly' | 'hostile' | 'normal' = 'normal'
    if (hostility <= -20) dialect = 'friendly'
    else if (hostility >= 40) dialect = 'hostile'

    const key = `npc.${npc.id}.scripts.${dialect}.${greetings}`

    return i18n.exists(key) ? i18n.t(key) : '...'
  }

  getSaveData() {
    return {
      states: this.states,
      factionHostility: this.factionHostility,
      factionContribution: this.factionContribution,
    }
  }
}
