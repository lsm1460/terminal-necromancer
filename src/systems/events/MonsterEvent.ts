import { Battle } from '~/core/battle'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { MonsterFactory } from '~/core/MonsterFactory'
import { Terminal } from '~/core/Terminal'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { Tile } from '~/types'
import { GameEventType } from '~/types/event'
import { delay } from '~/utils'
import { EventBus } from '../EventBus'

export class MonsterEvent {
  constructor(private monsterFactory: MonsterFactory, eventBus: EventBus, private battle: Battle, private world: World) {
    eventBus.subscribe(GameEventType.SPAWN_MONSTER, this.handle)
  }

  async handle(tile: Tile) {
    if (tile.isClear) return

    if (!tile.monsters) tile.monsters = []

    const aliveMonsters = tile.monsters.filter((m) => m.isAlive)
    const limit = tile.spawn_limit || 1

    if (aliveMonsters.length === 0) {
      for (let i = 0; i < limit; i++) {
        const monster = this.monsterFactory.spawn(tile)

        if (monster) {
          tile.monsters.push(monster)

          Terminal.attack(i18n.t('battle.monster_event.spawn', { name: monster.name }))
        }
      }
    }

    const finalAlive = tile.monsters.filter((m) => m.isAlive)
    if (finalAlive.length > 0) {
      Terminal.attack(finalAlive.map((m) => m.name).join(', '), i18n.t('battle.monster_event.current_enemies'))

      const preemptiveEnemy = finalAlive.find((_monster) => _monster.preemptive)

      if (preemptiveEnemy) {
        Terminal.log(i18n.t('battle.monster_event.preemptive_attack', { name: preemptiveEnemy.name }))

        await delay()

        const units: CombatUnit[] = finalAlive.map((m) => this.battle.toCombatUnit(m, 'monster'))

        tile.isClear = await this.battle.runCombatLoop(units, this.world)
      }
    }
  }
}
