import { CombatUnit, CommandFunction, Terminal } from '~/core'
import i18n from '~/i18n'

export const attackCommand: CommandFunction = async (args, context) => {
  const { npcs, battle, world, currentTile: tile } = context
  

  if ((tile.npcIds || [])?.length > 0) {
    const proceed = await Terminal.confirm(i18n.t('commands.combat.confirm_kill'))

    if (!proceed) {
      Terminal.log(i18n.t('commands.combat.cancel_murder'))
      return false // 교체 중단
    }
  }

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []).map((m) => battle.toCombatUnit(m, 'monster')),
    ...npcs
      .getAliveNPCInTile({ tile }, { withoutFaction: ['untouchable'] })
      .map((n) => battle.toCombatUnit(n!, 'npc')),
  ] as CombatUnit[]

  if (battleTargets.length === 0) {
    Terminal.log(i18n.t('commands.combat.no_targets'))
    return false
  }

  tile.isClear = await battle.runCombatLoop(battleTargets, world)

  return false
}
