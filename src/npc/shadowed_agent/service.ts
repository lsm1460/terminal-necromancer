import { AppContext } from "~/systems/types"

export const ShadowedService = {
  /**
   * 섀도우드 요원과의 조우 이벤트 완료 여부 확인
   */
  isMet(context: AppContext): boolean {
    return context.events.isCompleted('b5_shadowed')
  }
}