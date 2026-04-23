import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { SkillManager } from '~/core/skill/SkillManager'
import { CommandFunction } from '~/core/types'
import { GameNPC } from '~/systems/npc/GameNPC'
import { delay } from '~/utils'

export const skillCommand: CommandFunction = async (args, context) => {
  const { player, npcs, battle, world, eventBus, currentTile: tile } = context

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []),
    ...npcs.getAliveNPCInTile({ tile }, { withoutFaction: ['untouchable'] }),
  ]

  const enemies: CombatUnit[] = battleTargets.map((target) => {
    const isNpc = !!(target as GameNPC).faction

    const unit = battle.toCombatUnit(target, isNpc ? 'npc' : 'monster')
    battle.appendUnitDeathCallback(unit)

    return unit
  })

  const ally: CombatUnit[] = player.party.map((m) => battle.toCombatUnit(m, 'party'))

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
