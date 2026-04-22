import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { SkillManager } from '~/core/skill/SkillManager'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { GameNPC } from '~/systems/npc/GameNPC'
import { CommandFunction } from '~/types'
import { delay } from '~/utils'

export const skillCommand: CommandFunction = async (args, context) => {
  const { player, map, npcs, battle, world, eventBus, currentTile: tile } = context
  const necromancer = player as Necromancer

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []),
    ...npcs.getAliveNPCInTile({ tile, hasKnight: !!necromancer.knight }, { withoutFaction: ['untouchable'] }),
  ]

  const enemies: CombatUnit[] = battleTargets.map((target) => {
    const isNpc = !!(target as GameNPC).faction

    const unit = battle.toCombatUnit(target, isNpc ? 'npc' : 'monster')
    battle.appendUnitDeathCallback(unit)

    return unit
  })

  const ally: CombatUnit[] = necromancer.minions.map((m) => battle.toCombatUnit(m, 'minion'))

  const { isAggressive, gross } = await SkillManager.requestAndExecuteSkill(
    battle.toCombatUnit(necromancer, 'player'),
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
