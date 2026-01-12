import { Battle, CombatUnit } from '../core/Battle'
import { SkillManager } from '../core/skill'
import { CommandFunction, NPC } from '../types'

export const skillCommand: CommandFunction = async (player, args, context) => {
  const { map, npcs } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  const enemies = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []).map((_target) => Battle.toCombatUnit(_target, 'monster')),
    ...(tile.npcIds || [])
      .map((id) => npcs.getNPC(id)) // ID로 NPC 객체 조회
      .filter((npc): npc is NPC => !!npc && npc.isAlive && npc.faction !== 'untouchable')
      .map((_target) => Battle.toCombatUnit(_target, 'npc')),
  ]

  await SkillManager.requestAndExecuteSkill(Battle.toCombatUnit(player, 'player'), context, enemies as CombatUnit[])

  return false
}
