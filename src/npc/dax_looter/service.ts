import { GameContext } from '~/types'

export const DaxService = {
  /**
   * 닥스와의 첫 만남 이벤트가 완료되었는지 확인
   */
  isMet(context: GameContext): boolean {
    return context.events.isCompleted('b5_dax')
  }
}