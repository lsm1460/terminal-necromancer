import { AppContext } from "~/systems/types"

export const JaxService = {
  /** 저항군 가입(기지 발견) 여부 확인 */
  isJoined(context: AppContext): boolean {
    return context.events.isCompleted('RESISTANCE_BASE')
  },

  /** 현재 가능한 특별 액션(가입 퀘스트 등) 반환 */
  getActiveAction(context: AppContext) {
    if (!this.isJoined(context)) {
      return { name: 'join', message: 'small_talk' }
    }
    return null
  }
}