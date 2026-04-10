import { Terminal } from '~/core/Terminal'
import { GameEventType } from '~/types/event'
import { EventBus } from './EventBus'

export class EventLedger {
  private completedEvents: Set<string> = new Set()

  constructor(private eventBus: EventBus, savedData?: string[]) {
    if (savedData) this.completedEvents = new Set(savedData)
  }

  public completeEvent(eventId: string) {
    try {
      if (!this.completedEvents.has(eventId)) {
        this.completedEvents.add(eventId)
        this.eventBus.emitAsync(GameEventType.COMPLETE_EVENT, eventId)
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
