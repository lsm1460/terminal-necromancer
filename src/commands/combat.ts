import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction } from '~/types'

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

  npcs.getAliveNPCInTile({ withoutFaction: ['untouchable'] })

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []).map((m) => battle.toCombatUnit(m, 'monster')),
    ...npcs.getAliveNPCInTile({ withoutFaction: ['untouchable'] }).map((n) => battle.toCombatUnit(n!, 'npc')),
  ] as CombatUnit[]

  if (battleTargets.length === 0) {
    Terminal.log(i18n.t('commands.combat.no_targets'))
    return false
  }

  tile.isClear = await battle.runCombatLoop(battleTargets, context)

  return false
}
