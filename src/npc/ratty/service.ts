import { GameContext } from '~/types'

export const RattyService = {
  /**
   * 첫 대면(위협) 이벤트 완료 여부 확인
   */
  isMet(context: GameContext) {
    return context.events.isCompleted('b2_ratty')
  }
}