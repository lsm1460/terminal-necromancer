import { Battle } from '~/core/battle'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { EventBus } from '~/core/EventBus'
import { MonsterFactory } from '~/core/MonsterFactory'
import { Terminal } from '~/core/Terminal'
import { GameEventType, IMonsterEvent, Tile } from '~/core/types'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { delay } from '~/utils'

export class MonsterEvent implements IMonsterEvent {
  constructor(
    private monsterFactory: MonsterFactory,
    eventBus: EventBus,
    private battle: Battle,
    private world: World
  ) {
    eventBus.subscribe(GameEventType.SPAWN_MONSTER, this.handle)
  }

  handle = async ({ tile, isPassMonster }: { tile: Tile; isPassMonster: boolean }) => {
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

      if (!isPassMonster && preemptiveEnemy) {
        Terminal.log(i18n.t('battle.monster_event.preemptive_attack', { name: preemptiveEnemy.name }))

        await delay()

        const units: CombatUnit[] = finalAlive.map((m) => this.battle.toCombatUnit(m, 'monster'))

        tile.isClear = await this.battle.runCombatLoop(units, this.world)
      }
    }
  }
}
