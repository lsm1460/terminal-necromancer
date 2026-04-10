import i18n from '~/i18n'
import { GameContext, ItemType } from '~/types'

export const KnightService = {
  getActiveQuest(context: GameContext) {
    const { events } = context
    const alreadyTalk = events.isCompleted('talk_knight')

    if (!alreadyTalk) {
      return { name: 'first', message: i18n.t('talk.speak') }
    }
    return null
  },

  getUpgradeCandidates(inventory: any[]) {
    return inventory
      .filter((item) => [ItemType.WEAPON, ItemType.ARMOR].includes(item.type))
      .map((item) => ({ name: item.id, message: item.name }))
  },

  getResetCost(upgradeCount: number) {
    return upgradeCount * 300
  }
}