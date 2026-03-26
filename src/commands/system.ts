import { COMMAND_GROUPS } from '~/consts'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { SaveSystem } from '~/systems/SaveSystem'
import { CommandFunction } from '~/types'

// --- Exit ---
export const exitCommand: CommandFunction = (player, args, context) => {
  Terminal.log(i18n.t('commands.system.exit.saving'))

  // 1. 현재 상태 저장
  const saveData = SaveSystem.makeSaveData(player, context)
  context.save.save(saveData)

  Terminal.log(i18n.t('commands.system.exit.save_complete'))
  Terminal.log(i18n.t('commands.system.exit.farewell'))

  return 'exit'
}

export const helpCommand: CommandFunction = (player, args, context) => {
  Terminal.log(i18n.t('commands.system.help.title'))

  for (const [command, aliases] of Object.entries(COMMAND_GROUPS)) {
    Terminal.log(
      i18n.t('commands.system.help.list_item', {
        command,
        aliases: aliases.join(', '),
      })
    )
  }

  return false
}

export const clearCommand: CommandFunction = () => {
  console.clear()
  return false
}
