import { AppContext } from "~/systems/types"

export const EliasService = {
  /**
   * 엘리어스와의 조우 이벤트 완료 여부 확인
   */
  isMet(context: AppContext): boolean {
    return context.events.isCompleted('b5_elias')
  }
}