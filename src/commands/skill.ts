import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { SkillManager } from '~/core/skill'
import { CommandFunction, NPC } from '~/types'
import { delay } from '~/utils'

export const skillCommand: CommandFunction = async (args, context) => {
  const { player, map, npcs, battle, world, eventBus } = context
  const tile = map.getTile(player.pos)

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []),
    ...npcs.getAliveNPCInTile(
      { pos: player.pos, hasKnight: !!player.knight, map },
      { withoutFaction: ['untouchable'] }
    ),
  ]

  const enemies: CombatUnit[] = battleTargets.map((target) => {
    const isNpc = !!(target as NPC).faction

    const unit = battle.toCombatUnit(target, isNpc ? 'npc' : 'monster')
    battle.appendUnitDeathCallback(unit)

    return unit
  })

  const ally: CombatUnit[] = player.minions.map((m) => battle.toCombatUnit(m, 'minion'))

  const { isAggressive, gross } = await SkillManager.requestAndExecuteSkill(
    battle.toCombatUnit(player, 'player'),
    { world, eventBus },
    {
      ally,
      enemies,
    }
  )

  if (isAggressive) {
    await delay()

    tile.isClear = await battle.runCombatLoop(enemies, world)
  }

  return false
}
