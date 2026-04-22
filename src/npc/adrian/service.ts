import i18n from '~/i18n'
import { AppContext } from '~/systems/types'

export const AdrianService = {
  getActiveQuest(context: AppContext) {
    const { events } = context
    const alreadyTalk = events.isCompleted('b5_adrian')

    if (!alreadyTalk) {
      return { name: 'event', message: i18n.t('talk.examine') }
    }

    return null
  }
}