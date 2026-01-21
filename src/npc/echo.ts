import { handleTalk, NPCHandler } from './NPCHandler'

const EchoHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'talk', message: '💬 잡담' },
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
