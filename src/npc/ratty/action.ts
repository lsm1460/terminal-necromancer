import { GameContext } from '~/types'
import { speak } from '~/utils'
import i18n from '~/i18n'

export const RattyActions = {
  /**
   * 위협 대사 출력 및 이벤트 완료 처리
   */
  async handleThreat(context: GameContext) {
    const dialogues = i18n.t('npc.ratty.threat.dialogues', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b2_ratty')
    return true
  }
}