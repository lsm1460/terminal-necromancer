import { GameContext } from "~/core/types"

export const OliverService = {
  /**
   * 올리버와의 마지막 대화(이벤트) 완료 여부 확인
   */
  isMet(context: GameContext): boolean {
    return context.events.isCompleted('b5_oliver')
  }
}