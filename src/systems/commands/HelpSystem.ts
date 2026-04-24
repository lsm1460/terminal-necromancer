import { Terminal, ICommandManager, ICommandSystem } from '~/core'
import { COMMAND_GROUPS } from '~/core/consts'
import i18n from '~/i18n'

export class HelpSystem implements ICommandSystem {
  install(handler: ICommandManager) {
    handler.register('help', this.handleHelp)
  }

  private handleHelp() {
    Terminal.log(i18n.t('commands.system.help.title'))

    for (const [command, aliases] of Object.entries(COMMAND_GROUPS)) {
      Terminal.log({
        key: 'commands.system.help.list_item',
        args: {
          command,
          aliases: aliases.join(', '),
        },
      })
    }

    return false
  }
}
