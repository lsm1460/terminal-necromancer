import _ from 'lodash'
import i18n from '~/i18n'
import { EventBus } from '~/systems/EventBus'
import { GameEventType } from '~/types/event'
import { NPCManager } from './NpcManager'
import { Terminal } from './Terminal'

export class Broadcast {
  private pendingQueue: string[] = []
  private playProgress: Record<string, number> = {}
  private playedState: Record<string, boolean> = {}

  private justFinishedEvent = false

  constructor(
    private npcManager: NPCManager,
    eventBus: EventBus
  ) {
    eventBus.subscribe(GameEventType.COMPLETE_EVENT, this.onEventCleared)
  }

  private onEventCleared(eventId: string) {
    const key = `broadcast.${eventId}`

    if (i18n.exists(key) && !this.playedState[eventId]) {
      this.pendingQueue.push(eventId)
    }
  }

  async play() {
    // 0. 대기열이 없으면 낮은 확률로 시스템 메시지(랜덤 멘트) 발송
    if (_.isEmpty(this.pendingQueue)) {
      const BROADCAST_CHANCE = 0.15
      const terminalKey = 'broadcast.terminalMessages'

      if (Math.random() < BROADCAST_CHANCE && i18n.exists(terminalKey)) {
        const messages = i18n.t(terminalKey, { returnObjects: true }) as string[]
        const message = _.sample(messages)

        if (message) {
          Terminal.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          Terminal.log(`📡 [${i18n.t('broadcast.broadcast_echo')}]`)
          Terminal.log(`  ${message}`)
          Terminal.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }
      }
      return
    }

    // 1. 현재 재생할 이벤트 확인
    const currentEventId = this.pendingQueue[0]
    const eventKey = `broadcast.${currentEventId}`

    // 해당 이벤트 번역 데이터가 없으면 큐에서 제거하고 종료
    if (!i18n.exists(eventKey)) {
      this.pendingQueue.shift()
      return
    }

    const content = i18n.t(eventKey, { returnObjects: true }) as any
    const currentIndex = this.playProgress[currentEventId] || 0

    // 2. 방송 헤더 출력
    Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Terminal.log(`📡 [${i18n.t('broadcast.broadcast_echo')}]`)

    // 3. 브릿지 멘트 출력 (새 이벤트의 첫 줄일 때만 + 이전 이벤트가 방금 끝났을 때)
    const bridgeKey = 'broadcast.bridgeMemos'
    if (currentIndex === 0 && this.justFinishedEvent && i18n.exists(bridgeKey)) {
      const bridgeMemos = i18n.t(bridgeKey, { returnObjects: true }) as string[]
      const randomBridge = _.sample(bridgeMemos)

      if (randomBridge) {
        Terminal.log(`  ${randomBridge}`)
      }

      // 브릿지는 한 번만 출력하고 플래그 초기화
      this.justFinishedEvent = false
    }

    // 4. 메인 대사 출력 (진영 적대치에 따른 분기)
    const isHostile = this.npcManager.getFactionContribution('resistance') >= 30
    const lines = isHostile ? content?.hostile : content?.normal

    if (Array.isArray(lines) && currentIndex < lines.length) {
      Terminal.log(`  📢 "${lines[currentIndex]}"`)

      // 진행도 업데이트
      this.playProgress[currentEventId] = currentIndex + 1

      // 모든 줄을 다 읽었는지 확인
      if (this.playProgress[currentEventId] >= lines.length) {
        this.playedState[currentEventId] = true
      }
    }

    Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // 5. 이벤트가 완전히 종료되었다면 큐에서 제거하고 다음 브릿지 준비
    if (this.playedState[currentEventId]) {
      this.pendingQueue.shift()
      this.justFinishedEvent = true
    }
  }
}
