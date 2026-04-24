import { GameEventType } from './types'

type BusCallback<T = any> = (payload: T) => void | Promise<void>

export interface Subscription {
  unsubscribe: () => void
}

export class EventBus {
  private subscribers: Map<GameEventType, BusCallback[]> = new Map()

  public subscribe<T = any>(type: GameEventType, callback: BusCallback<T>): Subscription {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, [])
    }
    this.subscribers.get(type)?.push(callback)

    return {
      unsubscribe: () => this.unsubscribe(type, callback),
    }
  }

  public async emitAsync<T = any>(type: GameEventType, payload?: T): Promise<void> {
    const handlers = this.subscribers.get(type)
    if (handlers) {
      for (const callback of handlers) {
        await callback(payload)
      }
    }
  }

  public unsubscribe(type: GameEventType, callback: BusCallback): void {
    const handlers = this.subscribers.get(type)
    if (handlers) {
      const filtered = handlers.filter((h) => h !== callback)
      if (filtered.length === 0) {
        this.subscribers.delete(type) // 핸들러가 없으면 키 삭제
      } else {
        this.subscribers.set(type, filtered)
      }
    }
  }

  public clear(): void {
    this.subscribers.clear()
  }
}
