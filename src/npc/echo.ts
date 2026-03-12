import i18n from '~/i18n'
import { handleTalk, NPCHandler } from './NPCHandler'

const EchoHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      default:
        break
    }
  },
}

export default EchoHandler
