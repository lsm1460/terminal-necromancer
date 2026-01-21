import fs from 'fs'
import path from 'path'
import { EventSystem } from '../systems/EventSystem'
import { BroadcastScript } from '../types'
import { NPCManager } from './NpcManager'

export class Broadcast {
  private scripts: Record<string, BroadcastScript>
  private pendingQueue: string[] = []
  private playProgress: Record<string, number> = {}
  private playedState: Record<string, boolean> = {}

  private justFinishedEvent = false

  private bridgeMemos = [
    '📢 이전 보고에 이어 추가 알림입니다...',
    '📢 다음 소식입니다...',
    '📢 치이익... 긴급 갱신된 정보입니다.',
    '📢 방금 들어온 추가 제보를 전해드립니다.',
  ]

  constructor(
    scriptPath: string,
    private npcManager: NPCManager,
    eventSystem: EventSystem
  ) {
    this.scripts = JSON.parse(fs.readFileSync(path.resolve(scriptPath), 'utf-8'))

    eventSystem.subscribe((eventId) => this.onEventCleared(eventId))
  }

  private onEventCleared(eventId: string) {
    if (this.scripts[eventId] && !this.playedState[eventId]) {
      this.pendingQueue.push(eventId)
    }
  }

  async play() {
    // 1. 대기열이 비어있으면 종료
    if (this.pendingQueue.length === 0) return

    const currentEventId = this.pendingQueue[0]
    const content = this.scripts[currentEventId]
    const currentIndex = this.playProgress[currentEventId] || 0

    // 2. 헤더 출력
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📡 [터미널 브로드캐스팅: 에코]`)

    // 3. 브릿지 멘트 출력 조건 (새 이벤트 시작 + 이전 이벤트가 방금 끝났을 때)
    if (currentIndex === 0 && this.justFinishedEvent) {
      const randomBridge = this.bridgeMemos[Math.floor(Math.random() * this.bridgeMemos.length)]
      console.log(`  ${randomBridge}`)

      // 브릿지를 한 번 출력했으므로 플래그 초기화
      this.justFinishedEvent = false
    }

    // 4. 메인 대사 출력 (printNextLine 로직 통합)
    const isHostile = this.npcManager.getFactionContribution('resistance') >= 70
    const lines = isHostile ? content.hostile : content.normal

    if (currentIndex < lines.length) {
      console.log(`  📢 "${lines[currentIndex]}"`)

      // 진행도 업데이트
      this.playProgress[currentEventId] = currentIndex + 1

      // 해당 이벤트의 모든 줄을 다 읽었는지 확인
      if (this.playProgress[currentEventId] >= lines.length) {
        this.playedState[currentEventId] = true
      }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // 5. 이벤트가 완전히 종료되었다면 큐에서 제거하고 플래그 세우기
    if (this.playedState[currentEventId]) {
      this.pendingQueue.shift()
      this.justFinishedEvent = true // 다음 play() 호출 시 브릿지 출력 대상이 됨
    }
  }
}
