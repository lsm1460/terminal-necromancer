import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { speak } from '~/utils'

export const HansenActions = {
  /**
   * 정비공 한센 조우 이벤트 실행
   */
  async handleEncounter(context: GameContext) {
    const dialogues = i18n.t('npc.hansen_mechanic.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_hansen')
    return true
  }
}