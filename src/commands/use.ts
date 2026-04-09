import { CommandFunction } from '~/types'

export const useCommand: CommandFunction = async (args, { player }) => {
  await player.useItem()

  return false
}
