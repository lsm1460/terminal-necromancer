import { EventSystem } from '~/systems/EventSystem'
import { BroadcastScript } from '~/types'
import { Terminal } from './Terminal'
import { NPCManager } from './NpcManager'
import i18n from '~/i18n'

export class Broadcast {
  private pendingQueue: string[] = []
  private playProgress: Record<string, number> = {}
  private playedState: Record<string, boolean> = {}

  private justFinishedEvent = false

  /**
   * @param npcManager - NPC 상태 확인을 위한 매니저
   * @param eventSystem - 이벤트 구독을 위한 시스템
   */
  constructor(private npcManager: NPCManager, eventSystem: EventSystem) {
    eventSystem.subscribe((eventId) => this.onEventCleared(eventId))
  }

  private onEventCleared(eventId: string) {
    const script = i18n.t(`broadcast.${eventId}`, { returnObjects: true })
    if (script && typeof script !== 'string' && !this.playedState[eventId]) {
      this.pendingQueue.push(eventId)
    }
  }

  async play() {
    // 0. 대기열이 없으면 랜덤 멘트 발송
    if (this.pendingQueue.length === 0) {
      const BROADCAST_CHANCE = 0.15

      if (Math.random() < BROADCAST_CHANCE) {
        const messages = i18n.t('broadcast.terminalMessages', { returnObjects: true }) as string[]
        if (Array.isArray(messages) && messages.length > 0) {
          const randomIndex = Math.floor(Math.random() * messages.length)
          const message = messages[randomIndex]

          Terminal.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          Terminal.log(`📡 [${i18n.t('broadcast.broadcast_echo')}]`)
          Terminal.log(`  ${message}`)
          Terminal.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }
      }

      return
    }

    const currentEventId = this.pendingQueue[0]
    const content = i18n.t(`broadcast.${currentEventId}`, { returnObjects: true }) as any
    const currentIndex = this.playProgress[currentEventId] || 0

    // 2. 헤더 출력
    Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Terminal.log(`📡 [${i18n.t('broadcast.broadcast_echo')}]`)

    // 3. 브릿지 멘트 출력 조건 (새 이벤트 시작 + 이전 이벤트가 방금 끝났을 때)
    if (currentIndex === 0 && this.justFinishedEvent) {
      const bridgeMemos = i18n.t('broadcast.bridgeMemos', { returnObjects: true }) as string[]
      if (Array.isArray(bridgeMemos) && bridgeMemos.length > 0) {
        const randomBridge = bridgeMemos[Math.floor(Math.random() * bridgeMemos.length)]
        Terminal.log(`  ${randomBridge}`)
      }

      // 브릿지를 한 번 출력했으므로 플래그 초기화
      this.justFinishedEvent = false
    }

    // 4. 메인 대사 출력 (printNextLine 로직 통합)
    const isHostile = this.npcManager.getFactionContribution('resistance') >= 70
    const lines = isHostile ? content.hostile : content.normal

    if (lines && currentIndex < lines.length) {
      Terminal.log(`  📢 "${lines[currentIndex]}"`)

      // 진행도 업데이트
      this.playProgress[currentEventId] = currentIndex + 1

      // 해당 이벤트의 모든 줄을 다 읽었는지 확인
      if (this.playProgress[currentEventId] >= lines.length) {
        this.playedState[currentEventId] = true
      }
    }

    Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // 5. 이벤트가 완전히 종료되었다면 큐에서 제거하고 플래그 세우기
    if (this.playedState[currentEventId]) {
      this.pendingQueue.shift()
      this.justFinishedEvent = true // 다음 play() 호출 시 브릿지 출력 대상이 됨
    }
  }
}
