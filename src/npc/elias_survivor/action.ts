import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'

export const EliasActions = {
  /**
   * 생존자 엘리어스 조우 대화 및 이벤트 완료 처리
   */
  async handleEncounter(context: AppContext) {
    const dialogues = i18n.t('npc.elias_survivor.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_elias')
    return true
  }
}