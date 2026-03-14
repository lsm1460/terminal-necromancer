import i18n from '~/i18n'
import { handleTalk, NPCHandler } from './NPCHandler'
import { handleChildResistanceDiscovery } from './kael'

const VesperHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_child_resistance_encounter')

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    } else {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        return await handleChildResistanceDiscovery(player, npc, context)
      default:
        break
    }
  },
}

export default VesperHandler
