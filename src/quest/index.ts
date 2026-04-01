import { Player } from '~/core/player/Player'
import death from '../quest/death'
import { GameContext } from '~/types'

export type DeathHandler = (player: Player, context: GameContext) => Promise<void>

const npcDeathHandlers: Record<string, DeathHandler> = {
  death,
}

export default npcDeathHandlers
