// systems/EventSystem.ts
import fs from 'fs'
import path from 'path'
import { MonsterFactory } from '../core/MonsterFactory'
import { Player } from '../core/Player'
import { GameContext, GameEvent, Tile } from '../types'
import { MonsterEvent } from './events/MonsterEvent'
import { NpcEvent } from './events/NpcEvent'
import { BossEvent } from './events/BossEvent'

export class EventSystem {
  private completedEvents: Set<string> = new Set()
  private monsterEvent: MonsterEvent
  private eventData: Record<string, GameEvent> = {}

  constructor(eventPath: string, monsterFactory: MonsterFactory, savedData?: string[]) {
    if (savedData) this.completedEvents = new Set(savedData)

    this.monsterEvent = new MonsterEvent(monsterFactory)
    this.eventData = JSON.parse(fs.readFileSync(path.resolve(eventPath), 'utf-8'))
  }

  async handle(tile: Tile, player: Player, context: GameContext) {
    switch (tile.event) {
      case 'heal':
        player.hp = player.maxHp
        player.mp = player.maxMp
        break

      case 'monster':
      case 'monster-group-level-1':
        await this.monsterEvent.handle(tile, player, context)
        break
      case 'boss':
        await BossEvent.handle(tile, player, context)
        break

      case 'npc': {
        await NpcEvent.handle(tile, player, context)
        break
      }
    }
  }

  public getEventInfo(eventId: string) {
    return this.eventData[eventId]
  }

  /** 이벤트 완료 처리 */
  public completeEvent(eventId: string) {
    if (!this.completedEvents.has(eventId)) {
      this.completedEvents.add(eventId)
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
}
