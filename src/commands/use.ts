import { CommandFunction } from "~/core/types"

export const useCommand: CommandFunction = async (args, { player }) => {
  const isUseAll = args[0] === 'all'
  await player.useItem(undefined, isUseAll)

  return false
}
