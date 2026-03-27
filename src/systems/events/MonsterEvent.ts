import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { MonsterFactory } from '~/core/MonsterFactory'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, Tile } from '~/types'
import { delay } from '~/utils'

export class MonsterEvent {
  constructor(public monsterFactory: MonsterFactory) {}

  async handle(tile: Tile, context: GameContext) {
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

        const units: CombatUnit[] = finalAlive.map((m) => context.battle.toCombatUnit(m, 'monster'))

        tile.isClear = await context.battle.runCombatLoop(units, context)
      }
    }
  }
}
