import { Player } from '../core/Player'
import { GameContext } from '../types'
import { NPCHandler } from './NPCHandler'

const ElevatorHandler: NPCHandler = {
  getChoices(npc, context) {
    return [
      { name: 'elevate', message: '💬 층 간 이동' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'elevate':
        await handleElevate(player, context)
        break
      default:
        break
    }
  },
}

async function handleElevate(player: Player, context: GameContext) {

}

export default ElevatorHandler
