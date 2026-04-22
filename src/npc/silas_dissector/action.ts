import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { speak } from '~/utils'

export const SilasActions = {
  /**
   * 실라스 조우 시퀀스 실행
   */
  async handleEncounter(context: GameContext) {
    const dialogues = i18n.t('npc.silas_dissector.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_silas')
    return true
  }
}