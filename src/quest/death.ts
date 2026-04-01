import BossEvent from '~/systems/events/BossEvent'
import { DeathHandler as Handler } from '.'

const DeathHandler: Handler = async (player, context) => {
  const npcId = 'death'

  const { npcs, map } = context
  const tile = map.getTile(player.x, player.y)

  npcs.setAlive(npcId)
  await BossEvent.handle(tile, player, context)
}

export default DeathHandler
