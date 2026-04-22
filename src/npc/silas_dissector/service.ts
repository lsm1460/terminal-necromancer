import { GameContext } from "~/core/types"

export const SilasService = {
  /**
   * 실라스와의 조우 이벤트 완료 여부 확인
   */
  isMet(context: GameContext): boolean {
    return context.events.isCompleted('b5_silas')
  }
}