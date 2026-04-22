import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'

export const ShadowedActions = {
  /**
   * 섀도우드 요원 조우 시퀀스 실행
   */
  async handleEncounter(context: AppContext) {
    const dialogues = i18n.t('npc.shadowed_agent.encounter', { returnObjects: true }) as string[]

    await speak(dialogues)

    context.events.completeEvent('b5_shadowed')
    return true
  }
}