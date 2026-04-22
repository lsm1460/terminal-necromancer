import { GameNPC } from "~/systems/npc/GameNPC"
import { AppContext } from "~/systems/types"

export const KaelService = {
  /** 어린이 저항군 조우 이벤트 완료 여부 */
  isEncountered(context: AppContext): boolean {
    return context.events.isCompleted('b5_child_resistance_encounter')
  },

  /** 친밀도/기여도에 따른 설득 성공 여부 확인 */
  canPersuade(npc: GameNPC): boolean {
    return npc.factionContribution >= 20
  }
}