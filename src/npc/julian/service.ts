import { GameContext } from "~/core/types"

export const JulianService = {
  /**
   * 줄리안과의 조우 이벤트가 완료되었는지 확인
   */
  isMet(context: GameContext): boolean {
    return context.events.isCompleted('b5_julian')
  }
}