import { Player } from '~/core/player/Player'
import { GameContext } from '~/types'
import i18n from '~/i18n'

export const ZedService = {
  /**
   * 퀘스트 우선순위 판별
   */
  getActiveQuest(context: GameContext) {
    const { player, events } = context
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

    return null
  },

  /**
   * 골렘 업그레이드 비용 및 상태 계산
   */
  calculateUpgradeStats(player: Player) {
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
