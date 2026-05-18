import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { AppContext } from '~/systems/types'

export const ZedService = {
  /**
   * 퀘스트 우선순위 판별
   */
  getActiveQuest(context: AppContext) {
    const { player, events } = context

    const talk1 = !events.isCompleted('talk_zed_1')
    const talk2 = events.isCompleted('report_caron_to_death') && !events.isCompleted('talk_zed_2')
    const talk3 = events.isCompleted('talk_death_4') && !events.isCompleted('talk_zed_3')
    const talk4 = events.isCompleted('fourth_boss') && !events.isCompleted('talk_zed_4')

    const isB2Completed = events.isCompleted('talk_death_2')
    const isB3Completed = events.isCompleted('second_boss')
    const alreadyHeard = events.isCompleted('HEARD_RESISTANCE')
    const alreadyDenied = events.isCompleted('golem_generation_denied_zed')

    if (isB3Completed && !player.golem && !alreadyDenied) {
      return { name: 'golem', message: i18n.t('npc.dr_zed.choices.awake_golem') }
    }

    if (isB2Completed && !alreadyHeard) {
      return { name: 'resistance', message: i18n.t('talk.speak') }
    }

    if (talk4) {
      return { name: 'talk4', message: i18n.t('talk.speak') }
    }

    if (talk3) {
      return { name: 'talk3', message: i18n.t('talk.speak') }
    }
    
    if (talk2) {
      return { name: 'talk2', message: i18n.t('talk.speak') }
    }

    if (talk1) {
      return { name: 'talk1', message: i18n.t('talk.speak') }
    }

    return null
  },

  /**
   * 골렘 업그레이드 비용 및 상태 계산
   */
  calculateUpgradeStats(player: Necromancer) {
    const machineStacks = player.golemUpgrade.filter((s) => s === 'machine').length
    const soulStacks = player.golemUpgrade.filter((s) => s === 'soul').length
    const totalStacks = player.golemUpgrade.length

    const penaltyMultiplier = 1 + machineStacks * 0.5
    const upgradeCost = Math.floor(500 * (totalStacks + 1) * penaltyMultiplier)
    const removeCost = 1500
    const isHardLimit = totalStacks >= player.upgradeLimit + 1

    return {
      machineStacks,
      soulStacks,
      totalStacks,
      upgradeCost,
      removeCost,
      isHardLimit,
    }
  },
}
