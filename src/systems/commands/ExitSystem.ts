import { createExitCommand } from '~/commands'
import { Terminal } from '~/core/Terminal'
import { GameEventType, ICommandManager, ICommandSystem } from '~/core/types'
import i18n from '~/i18n'
import { SaveSystem } from '~/systems/SaveSystem'
import { AppContext } from '../types'

export class ExitSystem implements ICommandSystem {
  constructor(private context: AppContext) {}

  install(handler: ICommandManager) {
    handler.register('exit', createExitCommand(() => this.handleExit()))
  }

  private async handleExit(): Promise<void> {
    Terminal.log(i18n.t('commands.system.exit.saving'))

    const saveData = SaveSystem.makeSaveData(this.context)
    this.context.save.save(saveData)

    Terminal.log(i18n.t('commands.system.exit.save_complete'))
    Terminal.log(i18n.t('commands.system.exit.farewell'))

    await new Promise((resolve) => setTimeout(resolve, 500))

    // 2. 시스템 종료 이벤트 발행
    await this.context.eventBus.emitAsync(GameEventType.SYSTEM_EXIT)
  }
}