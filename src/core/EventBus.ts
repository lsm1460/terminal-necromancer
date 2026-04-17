import { GameEventType } from '~/types/event'

type BusCallback<T = any> = (payload: T) => void

export class EventBus {
  private subscribers: Map<GameEventType, BusCallback[]> = new Map()

  public subscribe<T = any>(type: GameEventType, callback: BusCallback<T>): void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, [])
    }
    this.subscribers.get(type)?.push(callback)
  }

  public async emitAsync<T = any>(type: GameEventType, payload?: T): Promise<void> {
    const handlers = this.subscribers.get(type);
    if (handlers) {
      for (const callback of handlers) {
        await callback(payload); 
      }
    }
  }

  public unsubscribe(type: GameEventType, callback: BusCallback): void {
    const handlers = this.subscribers.get(type)
    if (handlers) {
      this.subscribers.set(
        type,
        handlers.filter((h) => h !== callback)
      )
    }
  }

  public clear(): void {
    this.subscribers.clear()
  }
}
