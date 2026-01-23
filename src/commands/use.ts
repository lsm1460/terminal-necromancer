import { CommandFunction, ConsumableItem, ItemType } from '../types'

export const useCommand: CommandFunction = async (player, args, context) => {
  await player.useItem()

  return false
}
