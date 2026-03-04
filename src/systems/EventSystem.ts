import { Terminal } from '~/core/Terminal'
import { MonsterFactory } from '~/core/MonsterFactory'
import { Player } from '~/core/player/Player'
import { GameContext, GameEvent, Tile } from '~/types'
import { allEventHandlers } from './events'
import { MonsterEvent } from './events/MonsterEvent'

type EventCallback = (eventId: string) => void

export class EventSystem {
  private completedEvents: Set<string> = new Set()
  private monsterEvent: MonsterEvent
  private eventData: Record<string, GameEvent> = {}
  private subscribers: EventCallback[] = [] // 구독자 명단

  /**
   * @param eventData - 경로 대신 JSON 객체 데이터를 직접 받습니다.
   * @param monsterFactory - 몬스터 생성을 위한 팩토리
   * @param savedData - 완료된 이벤트 목록
   */
  constructor(eventData: any, monsterFactory: MonsterFactory, savedData?: string[]) {
    if (savedData) this.completedEvents = new Set(savedData)

    this.monsterEvent = new MonsterEvent(monsterFactory)

    this.eventData = eventData
  }

  async handle(tile: Tile, player: Player, context: GameContext) {
    const handler = allEventHandlers[tile.event]

    if (handler) {
      await handler(tile, player, context)
    }

    if (tile.event.startsWith('monster-')) {
      await this.monsterEvent.handle(tile, player, context)
    }

    tile.isSeen = true
    if (!(tile.event === 'boss' || tile.event.startsWith('monster') || tile.event.endsWith('-once'))) {
      tile.isClear = true
    }
  }

  public subscribe(callback: EventCallback) {
    this.subscribers.push(callback)
  }

  public getEventInfo(eventId: string) {
    return this.eventData[eventId]
  }

  /** 이벤트 완료 처리 */
  public completeEvent(eventId: string) {
    try {
      if (!this.completedEvents.has(eventId)) {
        this.completedEvents.add(eventId)
        this.subscribers.forEach((callback) => callback(eventId))
      }
    } catch (e) {
      Terminal.log(e as string)
    }
  }

  public getCompleted() {
    return [...this.completedEvents]
  }

  /** 이벤트 완료 여부 확인 */
  public isCompleted(eventId: string): boolean {
    return this.completedEvents.has(eventId)
  }

  /** 세이브를 위한 데이터 추출 */
  public getSaveData(): string[] {
    return Array.from(this.completedEvents)
  }

  public resetCompletedEvents() {
    this.completedEvents.clear()
  }
}
