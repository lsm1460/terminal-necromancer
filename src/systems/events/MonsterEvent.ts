import { CombatUnit } from '../../core/Battle'
import { MonsterFactory } from '../../core/MonsterFactory'
import { Player } from '../../core/Player'
import { GameContext, Monster, Tile } from '../../types'
import { delay } from '../../utils'

export class MonsterEvent {
  constructor(private monsterFactory: MonsterFactory) {}

  async handle(tile: Tile, player: Player, context: GameContext) {
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

        await delay()

        const units: CombatUnit[] = finalAlive.map((m) => context.battle.toCombatUnit(m, 'monster'))

        await context.battle.runCombatLoop(units, context)
      }
    }
  }
}
