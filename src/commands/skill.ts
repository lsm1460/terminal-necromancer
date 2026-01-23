import { CombatUnit } from '../core/battle/CombatUnit'
import { SkillManager } from '../core/skill'
import { CommandFunction, NPC } from '../types'
import { delay } from '../utils'

export const skillCommand: CommandFunction = async (player, args, context) => {
  const { map, npcs, battle } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []),
    ...(tile.npcIds || [])
      .map((id) => npcs.getNPC(id)) // ID로 NPC 객체 조회
      .filter((npc): npc is NPC => !!npc && npc.isAlive && npc.faction !== 'untouchable'),
  ]

  const enemies: CombatUnit[] = battleTargets.map((target) => {
    const isNpc = !!(target as NPC).faction

    return battle.toCombatUnit(target, isNpc ? 'npc' : 'monster')
  })

  const ally: CombatUnit[] = player.minions.map((m) => battle.toCombatUnit(m, 'minion'))

  const { isAggressive, gross } = await SkillManager.requestAndExecuteSkill(
    battle.toCombatUnit(player, 'player'),
    context,
    {
      ally,
      enemies
    }
  )

  if (isAggressive) {
    await delay()

    tile.isClear = await battle.runCombatLoop(enemies, context)
  }

  return false
}
