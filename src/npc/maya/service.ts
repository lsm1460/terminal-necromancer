
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'

export const MayaService = {
  getActiveQuest(context: GameContext) {
    const { player, events } = context
    const necromancer = player as Necromancer
    const isJoined = events.isCompleted('RESISTANCE_BASE')
    const isAlreadyMet = events.isCompleted('maya_1')
    const isB3Completed = events.isCompleted('second_boss')

    if (isJoined && !isAlreadyMet) {
      return { name: 'join', message: i18n.t('talk.speak') }
    }

    if (isB3Completed && !necromancer.golem) {
      return { name: 'golem', message: i18n.t('npc.maya_tech.choices.golem') }
    }

    return null
  },

  calculateUpgradeStats(player: Necromancer) {
    const machineStacks = player.golemUpgrade.filter((s) => s === 'machine').length
    const soulStacks = player.golemUpgrade.filter((s) => s === 'soul').length
    const totalStacks = player.golemUpgrade.length

    const penaltyMultiplier = 1 + soulStacks * 0.5
    const upgradeCost = Math.floor(1000 * (totalStacks + 1) * penaltyMultiplier)
    const removeCost = 3000

    return { machineStacks, soulStacks, totalStacks, upgradeCost, removeCost }
  },
}
