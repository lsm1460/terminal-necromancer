// systems/EventSystem.ts
import { Battle } from '../core/Battle'
import { MonsterFactory } from '../core/MonsterFactory'
import { NPCManager } from '../core/NpcManager'
import { Player } from '../core/Player'
import { GameContext, Monster, Tile } from '../types'

export class EventSystem {
  private completedEvents: Set<string> = new Set();

  constructor(
    path: string, 
    private monsterFactory: MonsterFactory,
    private npcManager: NPCManager,
    savedData?: string[]
  ) {
    if (savedData) {
      this.completedEvents = new Set(savedData);
    }
  }

  async handle(tile: Tile, player: Player, context: GameContext) {
    const { npcs } = context

    switch (tile.event) {
      case 'item': {
        break
      }

      case 'monster':
      case 'monster-group-level-1': {
        if (!tile.monsters) tile.monsters = []

        // 1. 현재 살아있는 몬스터 수 확인
        const aliveMonsters = tile.monsters.filter((m) => m.isAlive)
        const currentCount = aliveMonsters.length
        const limit = tile.spawn_limit || 1

        // 2. 부족한 마리수만큼 반복해서 spawn 호출
        const fillCount = limit - currentCount

        if (fillCount > 0) {
          const newlySpawned: Monster[] = []

          for (let i = 0; i < fillCount; i++) {
            // 기존 spawn 함수 그대로 사용 (Monster | null 리턴)
            const monster = this.monsterFactory.spawn(tile)

            if (monster) {
              newlySpawned.push(monster)
            }
          }

          if (newlySpawned.length > 0) {
            tile.monsters.push(...newlySpawned)
            console.log(`\n📢 ${tile.dialogue}`)
            newlySpawned.forEach((m) => console.log(`👾 ${m.name} 등장!`))
          }
        }

        // 3. 최종 상태 보고
        const finalAlive = tile.monsters.filter((m) => m.isAlive)
        if (finalAlive.length > 0) {
          console.log(`⚠️  현재 적: ${finalAlive.map((m) => m.name).join(', ')}`)

          const preemptiveEnemy = finalAlive.find((_monster) => _monster.preemptive)

          if (preemptiveEnemy) {
            console.log(`⚠️  적: ${preemptiveEnemy.name}의 기습!`)
            await Battle.runCombatLoop(player, finalAlive, context)
          }
        }

        break
      }

      case 'npc': {
        // 적대 세력은 선공한다
        const { map, npcs } = context
        const tile = map.getTile(player.pos.x, player.pos.y)

        const npcAlive = (tile.npcIds || [])
          .map((id: string) => npcs.getNPC(id))
          .filter((_npc) => !!_npc)
          .filter((_npc) => _npc.isAlive)

        const preemptiveEnemies = npcAlive.filter((_npc) => npcs.isHostile(_npc!.id))

        if (preemptiveEnemies.length > 0) {
          console.log(`⚠️  npc: ${preemptiveEnemies[0].name}의 기습!`)
          await Battle.runCombatLoop(player, preemptiveEnemies, context)
        }

        break
      }
    }
  }

  /** 이벤트 완료 처리 */
  public completeEvent(eventId: string) {
    if (!this.completedEvents.has(eventId)) {
      this.completedEvents.add(eventId);
    }
  }

  /** 이벤트 완료 여부 확인 */
  public isCompleted(eventId: string): boolean {
    return this.completedEvents.has(eventId);
  }

  /** 세이브를 위한 데이터 추출 */
  public getSaveData(): string[] {
    return Array.from(this.completedEvents);
  }
}
