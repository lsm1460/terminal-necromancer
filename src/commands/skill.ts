import { Battle, CombatUnit } from '../core/Battle'
import { SkillManager } from '../core/skill'
import { CommandFunction, NPC } from '../types'

export const skillCommand: CommandFunction = async (player, args, context) => {
  const { map, npcs } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []),
    ...(tile.npcIds || [])
      .map((id) => npcs.getNPC(id)) // ID로 NPC 객체 조회
      .filter((npc): npc is NPC => !!npc && npc.isAlive && npc.faction !== 'untouchable'),
  ]

  const enemies = battleTargets.map((target) => {
    const isNpc = !!(target as NPC).faction

    return Battle.toCombatUnit(target, isNpc? 'npc' : 'monster')
  })

  const { isAggressive, gross } = await SkillManager.requestAndExecuteSkill(
    Battle.toCombatUnit(player, 'player'),
    context,
    enemies as CombatUnit[]
  )

  if (isAggressive) {
    await Battle.runCombatLoop(player, battleTargets, context)
  }

  return false
}
