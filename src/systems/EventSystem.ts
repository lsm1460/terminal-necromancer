import { MonsterFactory } from '~/core/MonsterFactory'
import { Terminal } from '~/core/Terminal'
import { GameContext, Tile } from '~/types'
import { allEventHandlers } from './events'
import { MonsterEvent } from './events/MonsterEvent'

type EventCallback = (eventId: string) => void

export class EventSystem {
  private completedEvents: Set<string> = new Set()
  private monsterEvent: MonsterEvent
  private subscribers: EventCallback[] = [] // 구독자 명단

  /**
   * @param monsterFactory - 몬스터 생성을 위한 팩토리
   * @param savedData - 완료된 이벤트 목록
   */
  constructor(monsterFactory: MonsterFactory, savedData?: string[]) {
    if (savedData) this.completedEvents = new Set(savedData)

    this.monsterEvent = new MonsterEvent(monsterFactory)
  }

  async handle(tile: Tile, context: GameContext) {
    const handler = allEventHandlers[tile.event]

    if (handler) {
      await handler(tile, context)
    }

    if (tile.event.startsWith('monster-')) {
      await this.monsterEvent.handle(tile, context)
    }

    tile.isSeen = true
    if (!(tile.event === 'boss' || tile.event.startsWith('monster') || tile.event.endsWith('-once'))) {
      tile.isClear = true
    }
  }

  public subscribe(callback: EventCallback) {
    this.subscribers.push(callback)
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
