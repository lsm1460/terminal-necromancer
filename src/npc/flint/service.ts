import { GameContext } from '~/types'

export const FlintService = {
  /**
   * 플린트 메인 이벤트 완료 여부 확인
   */
  isEventCompleted(context: GameContext): boolean {
    return context.events.isCompleted('b5_flint')
  },

  /**
   * 현재 진행 가능한 특별 액션 확인
   */
  getActiveAction(context: GameContext) {
    if (!this.isEventCompleted(context)) {
      return { name: 'event', message: 'examine' }
    }
    return null
  }
}