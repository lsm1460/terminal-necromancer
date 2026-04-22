import { GameContext } from "~/core/types"

export const KaneService = {
  /** 현재 진행 가능한 특별 액션 확인 */
  getActiveAction(context: GameContext) {
    const { events, npcs } = context
    const isJoined = events.isCompleted('RESISTANCE_BASE')
    const isFirst = events.isCompleted('kane_1')
    const isSecond = events.isCompleted('kane_2')
    const caronFinished = events.isCompleted('defeat_caron')
    const isB5Completed = events.isCompleted('third_boss')

    const npc = npcs.getNPC('kane_leader')
    const isFriendly = (npc?.factionHostility ?? 0) <= 0

    // 1. 첫 조우/가입 이벤트
    if (isJoined && !isFirst) {
      return { name: 'join', message: 'talk.speak' }
    }

    // 2. B5 작전 브리핑 조건
    if (caronFinished && !isB5Completed && !isSecond && isFriendly) {
      return { name: 'B5Operation', message: 'npc.kane_leader.choice.B5Operation' }
    }

    return null
  },

  /** 기여도에 따른 호칭 키 반환 */
  getStatusKey(contribution: number): string {
    if (contribution >= 100) return 'pillar'
    if (contribution >= 50) return 'member'
    return 'stranger'
  }
}