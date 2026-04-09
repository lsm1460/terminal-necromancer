import { GameContext } from '~/types'
import i18n from '~/i18n'

export const AdrianService = {
  getActiveQuest(context: GameContext) {
    const { events } = context
    const alreadyTalk = events.isCompleted('b5_adrian')

    if (!alreadyTalk) {
      return { name: 'event', message: i18n.t('talk.examine') }
    }

    return null
  }
}