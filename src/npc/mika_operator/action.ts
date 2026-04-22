import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'

export const MikaActions = {
  /**
   * 미카 오퍼레이터 조우 시퀀스 실행
   */
  async handleEncounter(context: AppContext) {
    const dialogues = i18n.t('npc.mika_operator.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_mika')
    return true
  }
}