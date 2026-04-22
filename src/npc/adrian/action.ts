import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'

export const AdrianActions = {
  async handleEvent(context: AppContext) {
    const { events } = context

    const dialogues = i18n.t('npc.adrian.lobby_panic', { returnObjects: true }) as string[]

    await speak(dialogues)

    events.completeEvent('b5_adrian')
    return true
  }
}