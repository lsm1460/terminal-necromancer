import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, Tile } from '~/types'
import { delay } from '~/utils'

export class NpcEvent {
  constructor() {}

  static async handle(tile: Tile, context: GameContext) {
    // 적대 세력은 선공한다
    const { npcs, battle } = context

    const npcAlive = (tile.npcIds || [])
      .map((id: string) => npcs.getNPC(id))
      .filter((_npc) => !!_npc)
      .filter((_npc) => _npc.isAlive)

    const preemptiveEnemies = npcAlive.filter((_npc) => npcs.isHostile(_npc!.id))

    if (preemptiveEnemies.length > 0) {
      tile.isClear = false

      Terminal.log(i18n.t('events.npc.preemptive_attack', { name: preemptiveEnemies[0].name }));

      await delay()

      const units: CombatUnit[] = preemptiveEnemies.map((m) => context.battle.toCombatUnit(m, 'npc'))

      tile.isClear = await battle.runCombatLoop(units, context)
    }
  }
}
