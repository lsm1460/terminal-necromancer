import { printStatus } from '~/statusPrinter'
import { CommandFunction } from '~/types'
import { getItemLabel } from '~/utils'
import { lookAll, lookItem, printItem } from './overview'

export const lookCommand: CommandFunction = async (player, args, context) => {
  const [type, target] = args

  const { x, y } = player.pos
  const { map, world } = context
  const tile = map.getTile(x, y)

  const items = world.getDropsAt(x, y)

  if (type === 'item' && !target) {
    await lookItem(items, player)

    return false
  } else if (type === 'item' && target) {
    const targetItem = items.find((_item) => getItemLabel(_item).origin === target)
    printItem(targetItem)

    return false
  }

  printStatus(player, context)

  await lookAll(player, context, items, tile.monsters)

  return false
}
