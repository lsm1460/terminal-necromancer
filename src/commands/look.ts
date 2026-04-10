import { CommandFunction } from '~/types'
import { lookAll, lookItem, printItem } from './overview'

export const lookCommand: CommandFunction = async (args, context) => {
  const [type, target] = args

  const { player, map, world } = context
  const tile = map.getTile(player.pos)

  const items = world.getDropsAt(player.pos)

  if (type === 'item' && !target) {
    await lookItem(items, player)

    return false
  } else if (type === 'item' && target) {
    const targetItem = items.find((_item) => _item.origin === target)
    targetItem && printItem(targetItem)

    return false
  }

  await lookAll(context, items, tile.monsters)

  return false
}
