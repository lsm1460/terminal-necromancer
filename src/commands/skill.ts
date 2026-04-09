import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { SkillManager } from '~/core/skill'
import { CommandFunction, NPC } from '~/types'
import { delay } from '~/utils'

export const skillCommand: CommandFunction = async (args, context) => {
  const { player, map, npcs, battle } = context
  const tile = map.getTile(player.pos)

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []),
    ...npcs.getAliveNPCInTile({ withoutFaction: ['untouchable'] }),
  ]

  const enemies: CombatUnit[] = battleTargets.map((target) => {
    const isNpc = !!(target as NPC).faction

    const unit = battle.toCombatUnit(target, isNpc ? 'npc' : 'monster')
    battle.appendUnitDeathCallback(unit, context)

    return unit
  })

  const ally: CombatUnit[] = player.minions.map((m) => battle.toCombatUnit(m, 'minion'))

  const { isAggressive, gross } = await SkillManager.requestAndExecuteSkill(
    battle.toCombatUnit(player, 'player'),
    context,
    {
      ally,
      enemies,
    }
  )

  if (isAggressive) {
    await delay()

    tile.isClear = await battle.runCombatLoop(enemies, context)
  }

  return false
}
