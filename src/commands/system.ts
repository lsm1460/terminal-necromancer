import { COMMAND_GROUPS } from '~/consts'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { SaveSystem } from '~/systems/SaveSystem'
import { CommandFunction } from '~/types'
import { GameEventType } from '~/types/event'
import { delay } from '~/utils'

// --- Exit ---
export const exitCommand: CommandFunction = async (args, context) => {
  Terminal.log(i18n.t('commands.system.exit.saving'))

  // 1. 현재 상태 저장
  const saveData = SaveSystem.makeSaveData(context)
  context.save.save(saveData)

  Terminal.log(i18n.t('commands.system.exit.save_complete'))
  Terminal.log(i18n.t('commands.system.exit.farewell'))

  await delay()

  await context.eventBus.emitAsync(GameEventType.SYSTEM_EXIT)
  
  return 'exit'
}

export const helpCommand: CommandFunction = (args, context) => {
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
