import { handleTalk, NPCHandler } from './NPCHandler'

import { GameContext } from '../types'

export const MayaHandler: NPCHandler = {
  npcId: 'death',
  getChoices(context: GameContext) {
    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'levelUp', message: '✨ 레벨업' },
      { name: 'skillUnlock', message: '🔮 기술 전수' },
      { name: 'exit', message: '🏃 떠나기' },
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
