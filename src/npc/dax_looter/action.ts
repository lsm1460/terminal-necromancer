import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { speak } from '~/utils'

export const DaxActions = {
  /**
   * 조우 이벤트 실행 및 완료 처리
   */
  async handleEncounter(context: GameContext) {
    const dialogues = i18n.t('npc.dax_looter.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_dax')
    return true
  }
}