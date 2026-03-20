import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext } from '~/types'
import { delay } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const ApostleHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(context)

    if (quest) {
      return [quest]
    }

    return [{ name: 'talk', message: i18n.t('talk.examine') }]
  },
  hasQuest(player, npc, context) {
    return getActiveQuest(context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        await handleThreat(context)
        break
      default:
        break
    }
  },
}

async function handleThreat(context: GameContext) {
  const script = i18n.t('npc.apostle.event.script', { returnObjects: true }) as { text: string; delay: number }[]

  Terminal.log(`\x1b[90m${i18n.t('npc.apostle.event.intro_log')}\x1b[0m`)

  for (const line of script) {
    await delay(line.delay)

    Terminal.log(line.text)
  }

  context.events.completeEvent('b3_apostle')
}

function getActiveQuest(context: GameContext) {
  const { events } = context

  const alreadyTalk = events.isCompleted('b3_apostle')

  if (!alreadyTalk) {
    return { name: 'event', message: i18n.t('talk.examine') }
  }

  return null
}

export default ApostleHandler
