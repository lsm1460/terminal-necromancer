import { CommandFunction, Terminal } from '~/core'
import { COMMAND_GROUPS } from '~/core/consts'

export type ExitHandlerFn = () => Promise<void>

export const createExitCommand = (onExit?: ExitHandlerFn): CommandFunction => {
  return async () => {
    if (onExit) {
      await onExit()
    }

    return 'exit'
  }
}

export const exitCommand = createExitCommand()

export const helpCommand: CommandFunction = (args, context) => {
  Terminal.log({ key: 'commands.system.help.title' })

  for (const [command, aliases] of Object.entries(COMMAND_GROUPS)) {
    Terminal.log({
      key: 'commands.system.help.list_item',
      args: {
        command,
        aliases: aliases.join(', '),
      }
    })
  }

  return false
}

export const clearCommand: CommandFunction = () => {
  console.clear()
  return false
}
