import { HOSTILITY_LIMIT } from '~/consts'
import { NPC, NPCState } from '~/types'
import { Terminal } from './Terminal'
import { Player } from './player/Player'
import i18n from '~/i18n'

export class NPCManager {
  private baseData: Record<string, any>
  private states: Record<string, NPCState> = {}
  private factionHostility: Record<string, number> = {}
  private factionContribution: Record<string, number> = {}

  /**
   * @param npcData - 경로 문자열 대신 JSON 객체 데이터를 직접 받습니다.
   * @param player - 플레이어 참조
   * @param savedData - 세이브 파일에서 불러온 NPC 관련 상태 데이터
   */
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

      // 새로 추가된 NPC인 경우 초기값 주입
      this.states[id] = {
        hp: data.hp ?? data.maxHp ?? 100,
        isAlive: data.isAlive ?? true,
        reborn: data.reborn ?? false,
        relation: 0,
      }
    })
  }

  getNPC(id: string): NPC | null {
    const base = this.baseData[id]
    const state = this.states[id]

    if (!base || !state) return null
    if (state.reborn) return null

    const npc: NPC = {
      id,
      ...base,
      ...state,
      // 현재 소속이 적대적이라면 강제로 role을 변경하거나 상태 반영 가능
      isNpc: true,
      isHostile: this.isHostile(id),
      factionHostility: this.factionHostility[base.faction] || 0,
      factionContribution: this.factionContribution[base.faction] || 0,
      updateHostility: (_amount: number) => {
        this.updateFactionHostility(base.faction, _amount)
      },
      updateContribution: (_amount: number) => {
        this.updateFactionContribution(base.faction, _amount)
      },
      dead: (_karma = 1) => {
        this.player.karma += _karma
        this.states[id].isAlive = false

        npc.faction && this.setFactionHostility(npc.faction, 100)
      },

      get name() {
        return i18n.t(`npc.${this.id}.name`)
      },
      get deathLine() {
        return i18n.t(`npc.${this.id}.deathLine`)
      },
      get description() {
        return i18n.t(`npc.${this.id}.description`)
      },
      get lines() {
        return (i18n.t(`npc.${this.id}.lines`, { returnObjects: true }) || ['...']) as string[]
      },
    }

    return npc
  }

  reborn(id: string) {
    if (!this.states[id]) {
      return
    }

    this.states[id].reborn = true
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
    return this.factionContribution[faction]
  }

  public setFactionHostility(faction: string, amount: number) {
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      return
    }

    this.factionHostility[faction] = amount

    // 로그 공유
    this.updateFactionHostility(faction, 0)
  }

  /**
   * 특정 NPC가 적대적인지 확인 (소속 기반)
   */
  isHostile(id: string): boolean {
    const npc: NPC = this.baseData[id]

    if (npc.isBoss) {
      return true
    }

    if (this.factionHostility[npc.faction]) {
      return this.factionHostility[npc?.faction] >= HOSTILITY_LIMIT
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

  /**
   * 세이브를 위한 전체 데이터 추출
   */
  getSaveData() {
    return {
      states: this.states,
      factionHostility: this.factionHostility,
      factionContribution: this.factionContribution,
    }
  }
}
