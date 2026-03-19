import i18n from '~/i18n'
import { GameContext } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const BaronHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_baron')

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    } else {
      return [{ name: 'threat', message: i18n.t('talk.small_talk') }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'threat':
        await handleThreat(context)
        break
      default:
        break
    }
  },
}

async function handleThreat(context: GameContext) {
  const dialogues = i18n.t('npc.ratty.threat.dialogues', { returnObjects: true }) as string[]

  await speak(dialogues)

  context.events.completeEvent('b5_baron')
}

export default BaronHandler
