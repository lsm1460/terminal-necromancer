import fs from 'fs'
import { NPC } from '../types'

interface NPCState {
  hp: number
  isAlive: boolean
  relation: number // 호감도 등 확장용
}

export class NPCManager {
  private baseData: Record<string, any> // npc.json 원본
  private states: Record<string, NPCState> = {} // 가변 상태 데이터
  private factionHostility: Record<string, boolean> = {} // 소속별 적대 여부

  constructor(path: string, savedData?: any) {
    // 1. 원본 JSON 로드
    this.baseData = JSON.parse(fs.readFileSync(path, 'utf-8'))

    const hasValidSaveData = savedData && typeof savedData === 'object' && Object.keys(savedData).length > 0

    // 2. 세이브 데이터 복구 또는 초기화
    if (hasValidSaveData) {
      this.states = savedData.states || {}
      this.factionHostility = savedData.factionHostility || {}
    } else {
      this.initializeStates()
    }
  }

  private initializeStates() {
    Object.entries(this.baseData).forEach(([id, data]) => {
      this.states[id] = {
        hp: data.hp ?? data.maxHp ?? 100,
        isAlive: data.isAlive ?? true,
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

    return {
      id,
      ...base,
      ...state,
      // 현재 소속이 적대적이라면 강제로 role을 변경하거나 상태 반영 가능
      isHostile: this.factionHostility[base.faction] || false,
    }
  }

  findNPC(npcIds: string[], npcName: string): NPC | null {
    // 1. 전달받은 ID 목록을 순회하며 데이터 병합
    for (const id of npcIds) {
      const npc = this.getNPC(id)

      // 2. NPC 데이터가 존재하고, 이름이 입력값과 일치하는지 확인
      // (입력값의 공백 제거 및 소문자 변환을 통해 검색 정확도를 높입니다)
      if (npc && npc.name.replace(/\s+/g, '') === npcName.replace(/\s+/g, '')) {
        return npc
      }
    }

    // 3. 찾지 못한 경우 null 반환
    return null
  }

  /**
   * 데미지를 입히고, 해당 소속 전체를 적대 상태로 전환합니다.
   */
  takeDamage(id: string, damage: number): { isDead: boolean; faction: string } {
    const npc = this.getNPC(id)
    if (!npc || !npc.isAlive) return { isDead: false, faction: '' }

    // 방어력 적용 (최소 1 데미지)
    const actualDamage = Math.max(1, damage - (npc.def || 0))
    this.states[id].hp -= actualDamage

    console.log(`\n[전투] ${npc.name}에게 ${actualDamage}의 피해! (남은 HP: ${Math.max(0, this.states[id].hp)})`)

    // 피격 시 해당 소속 전체가 적대적으로 변함
    if (npc.faction) {
      this.setFactionHostile(npc.faction)
    }

    // 사망 체크
    if (this.states[id].hp <= 0) {
      this.states[id].hp = 0
      this.states[id].isAlive = false
      return { isDead: true, faction: npc.faction }
    }

    return { isDead: false, faction: npc.faction }
  }

  /**
   * 특정 소속을 적대적으로 설정
   */
  private setFactionHostile(faction: string) {
    if (!this.factionHostility[faction]) {
      this.factionHostility[faction] = true
      console.log(`\n⚠️  [경고] ${faction} 소속원들이 당신을 적대하기 시작했습니다!`)
    }
  }

  /**
   * 특정 NPC가 적대적인지 확인 (소속 기반)
   */
  isHostile(id: string): boolean {
    const npc = this.baseData[id]
    return this.factionHostility[npc?.faction] || false
  }

  /**
   * 세이브를 위한 전체 데이터 추출
   */
  getSaveData() {
    return {
      states: this.states,
      factionHostility: this.factionHostility,
    }
  }
}
