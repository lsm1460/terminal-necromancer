import fs from 'fs'
import { HOSTILITY_LIMIT } from '../consts'
import { NPC, NPCState } from '../types'
import { Player } from './Player'

export class NPCManager {
  private baseData: Record<string, any> // npc.json 원본
  private states: Record<string, NPCState> = {} // 가변 상태 데이터
  private factionHostility: Record<string, number> = {} // 소속별 적대도
  private factionContribution: Record<string, number> = {} // 소속별 기여도

  constructor(path: string, private player: Player, savedData?: any) {
    // 1. 원본 JSON 로드
    this.baseData = JSON.parse(fs.readFileSync(path, 'utf-8'))

    const hasValidSaveData = savedData && typeof savedData === 'object' && Object.keys(savedData).length > 0

    // 2. 세이브 데이터 복구 또는 초기화
    if (hasValidSaveData) {
      this.states = savedData.states || {}
      this.factionHostility = savedData.factionHostility || {}
      this.factionContribution = savedData.factionContribution || {}
    }

    this.initializeStates()
  }

  private initializeStates() {
    Object.entries(this.baseData).forEach(([id, data]) => {
      // 이미 상태 데이터가 존재한다면 건너뜁니다 (기존 데이터 보존)
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

  /**
   * NPC의 원본 데이터와 현재 동적 상태를 병합하여 반환합니다.
   */
  getNPC(id: string): NPC | null {
    const base = this.baseData[id]
    const state = this.states[id]

    if (!base || !state) return null
    if (state.reborn) return null

    const npc = {
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
      dead: (_karma = 1) => {
        this.player.karma += _karma
        this.states[id].isAlive = false

        npc.faction && this.setFactionHostility(npc.faction, 100)
      }
    }

    return npc
  }

  reborn(id: string) {
    if (!this.states[id]) {
      return
    }

    this.states[id].reborn = true
  }

  /**
   * 특정 소속을 적대적으로 설정
   */
  public updateFactionContribution(faction: string, amount: number) {
    this.factionContribution[faction] = (this.factionContribution[faction] || 0) + amount
  }

  public updateFactionHostility(faction: string, amount: number) {
    // 1. 이미 최대 적대치(100)에 도달했다면 변화 없이 리턴
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      return
    }

    // 2. 수치 가산
    this.factionHostility[faction] = (this.factionHostility[faction] || 0) + amount

    // 3. 100 도달 시 처리 (고정 및 알림)
    if (this.factionHostility[faction] >= HOSTILITY_LIMIT) {
      this.factionHostility[faction] = HOSTILITY_LIMIT
      console.log(`\n🚫 [영구 적대] ${faction} 소속과는 이제 돌이킬 수 없는 강을 건넜습니다.`)
      console.log(`🛡️ 해당 소속원들이 당신을 발견하는 즉시 공격할 것입니다!`)
      return
    }

    // 4. 최초 적대 시 알림 (기존 로직 유지)
    if (this.factionHostility[faction] > 0 && amount > 0) {
      console.log(
        `\n⚠️ [경고] ${faction} 소속과의 관계가 악화되었습니다. (현재: ${this.factionHostility[faction]}/${HOSTILITY_LIMIT})`
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

  getDialectType(hostility: number) {
    if (hostility <= -20) return 'friendly'
    if (hostility >= 40) return 'hostile'
    return 'normal'
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
