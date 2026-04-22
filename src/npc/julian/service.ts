import { AppContext } from "~/systems/types"

export const JulianService = {
  /**
   * 줄리안과의 조우 이벤트가 완료되었는지 확인
   */
  isMet(context: AppContext): boolean {
    return context.events.isCompleted('b5_julian')
  }
}