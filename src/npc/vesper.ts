import { handleTalk, NPCHandler } from './NPCHandler'
import { handleChildResistanceDiscovery } from './kael'

const VesperHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_child_resistance_encounter')

    if (alreadyTalk) {
      return [{ name: 'talk', message: '💬 잡담' }]
    } else {
      return [{ name: 'event', message: '🔍 살펴보기' }]
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
