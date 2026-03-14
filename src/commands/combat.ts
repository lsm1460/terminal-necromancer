import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction, NPC } from '~/types'

export const attackCommand: CommandFunction = async (player, args, context) => {
  const { map, npcs, battle } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  if ((tile.npcIds || [])?.length > 0) {
    const proceed = await Terminal.confirm(i18n.t('commands.combat.confirm_kill'))

    if (!proceed) {
      Terminal.log(i18n.t('commands.combat.cancel_murder'))
      return false // 교체 중단
    }
  }

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []).map((m) => battle.toCombatUnit(m, 'monster')),
    ...(tile.npcIds || [])
      .map((id) => context.npcs.getNPC(id)) // ID로 NPC 객체 조회
      .filter((npc): npc is NPC => !!npc && npc.isAlive && npc.faction !== 'untouchable')
      .map((n) => battle.toCombatUnit(n!, 'npc')),
  ] as CombatUnit[]

  // 2. 공격 대상이 없으면 종료
  if (battleTargets.length === 0) {
    Terminal.log(i18n.t('commands.combat.no_targets'))
    return false
  }

  // 3. 다대다 전투 루프(combatLoop) 진입
  tile.isClear = await battle.runCombatLoop(battleTargets, context)

  return false
}
