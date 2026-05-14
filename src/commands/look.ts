import { CommandFunction } from '~/core/types'
import { GameDrop } from '~/types/item'
import {
  getAccessiblePaths,
  getEntities,
  getTileFromDirection,
  lookAll,
  lookBattleTarget,
  lookItem,
  lookPath,
  printEntity,
  printItem,
  printPath,
} from './overview'

export const lookCommand: CommandFunction = async (args, context) => {
  const [type, target] = args

  const { player, world, map, currentTile: tile, npcs } = context

  const items = world.getDropsAt<GameDrop>(player.pos)

  if (type === 'item' && !target) {
    await lookItem(items, player)

    return false
  } else if (type === 'item' && target) {
    const targetItem = items.find((_item) => _item.origin === target)
    targetItem && printItem(targetItem)

    return false
  }

  if (type === 'path' && !target) {
    const accessiblePaths = getAccessiblePaths(player.pos, map)

    await lookPath(accessiblePaths)
    return false
  } else if (type === 'path' && target) {
    const tile = getTileFromDirection(player.pos, map, target)

    printPath(tile)

    return false
  }

  if (type === 'npc') {
    const aliveNPCs = getEntities(tile, npcs)
    if (target) {
      const npc = aliveNPCs.find((npc) => npc.id === target)
      printEntity(npc, context)
      return false
    } else {
      await lookBattleTarget(aliveNPCs, context)
      return false
    }
  }

  await lookAll(context, items)

  return false
}
