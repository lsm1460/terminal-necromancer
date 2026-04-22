import { CommandFunction } from '~/types'
import { GameDrop } from '~/types/item'
import { lookAll, lookItem, printItem } from './overview'

export const lookCommand: CommandFunction = async (args, context) => {
  const [type, target] = args

  const { player, world } = context

  const items = world.getDropsAt<GameDrop>(player.pos)

  if (type === 'item' && !target) {
    await lookItem(items, player)

    return false
  } else if (type === 'item' && target) {
    const targetItem = items.find((_item) => _item.origin === target)
    targetItem && printItem(targetItem)

    return false
  }

  await lookAll(context, items)

  return false
}
