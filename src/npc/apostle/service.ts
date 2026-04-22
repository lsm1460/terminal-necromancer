import { AppContext } from "~/systems/types"

export const ApostleService = {
  /**
   * 아포슬 이벤트(검사하기)가 완료되었는지 확인
   */
  isEventCompleted(context: AppContext): boolean {
    return context.events.isCompleted('b3_apostle')
  },

  /**
   * 현재 진행 가능한 특별 액션(퀘스트/이벤트) 반환
   */
  getActiveAction(context: AppContext) {
    if (!this.isEventCompleted(context)) {
      return { name: 'event', message: 'examine' } // i18n 키는 클래스에서 처리
    }
    return null
  }
}