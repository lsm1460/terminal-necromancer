import i18n from '~/i18n'
import { GameContext } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const AdrianHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(context)

    if (quest) {
      return [quest]
    }

    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  },
  hasQuest(player, context) {
    return getActiveQuest(context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        await handleEvent(context)
        break
      default:
        break
    }
  },
}

async function handleEvent(context: GameContext) {
  const { events } = context

  const dialogues = i18n.t('npc.adrian.lobby_panic', { returnObjects: true }) as string[]

  await speak(dialogues)

  events.completeEvent('b5_adrian')
}

function getActiveQuest(context: GameContext) {
  const { events } = context

  const alreadyTalk = events.isCompleted('b5_adrian')

  if (!alreadyTalk) {
    return { name: 'event', message: i18n.t('talk.examine') }
  }

  return null
}

export default AdrianHandler
