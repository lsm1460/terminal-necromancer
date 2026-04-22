import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { speak } from '~/utils'

export const AdrianActions = {
  async handleEvent(context: GameContext) {
    const { events } = context

    const dialogues = i18n.t('npc.adrian.lobby_panic', { returnObjects: true }) as string[]

    await speak(dialogues)

    events.completeEvent('b5_adrian')
    return true
  }
}