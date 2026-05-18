
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { AppContext } from '~/systems/types'

export const MayaService = {
  getActiveQuest(context: AppContext) {
    const { player, events } = context
    const isJoined = events.isCompleted('RESISTANCE_BASE')
    const isAlreadyMet = events.isCompleted('maya_1')
    const isB3Completed = events.isCompleted('second_boss')
    
    const talk1 = events.isCompleted('report_caron_to_death') && !events.isCompleted('talk_maya_1')
    const talk2 = events.isCompleted('third_boss_resistance') && !events.isCompleted('talk_maya_2')

    if (isJoined && !isAlreadyMet) {
      return { name: 'join', message: i18n.t('talk.speak') }
    }

    if (isB3Completed && !player.golem) {
      return { name: 'golem', message: i18n.t('npc.maya_tech.choices.golem') }
    }

    if (talk2) {
      return { name: 'talk2', message: i18n.t('talk.speak') }
    }

    if (talk1) {
      return { name: 'talk1', message: i18n.t('talk.speak') }
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

    const isFull = totalStacks >= player.upgradeLimit

    return { machineStacks, soulStacks, totalStacks, upgradeCost, removeCost, isFull }
  },
}
