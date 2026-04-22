import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Terminal } from '~/core/Terminal'
import { Tile } from '~/core/types'
import i18n from '~/i18n'
import { delay } from '~/utils'
import { AppContext } from '../types'

export class NpcEvent {
  static async handle(tile: Tile, context: AppContext) {
    // 적대 세력은 선공한다
    const { npcs, battle, world } = context

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

      tile.isClear = await battle.runCombatLoop(units, world)
    }
  }
}
