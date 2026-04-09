import { speak } from '~/utils'
import i18n from '~/i18n'
import { GameContext } from '~/types'

export const JulianActions = {
  /**
   * 줄리안 조우 이벤트 실행 및 완료 처리
   */
  async handleEncounter(context: GameContext) {
    const dialogues = i18n.t('npc.julian.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_julian')
    return true
  }
}