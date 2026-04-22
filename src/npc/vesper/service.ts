import { AppContext } from "~/systems/types"


export const VesperService = {
  /** 어린이 저항군 조우 이벤트 완료 여부 (카엘과 공유) */
  isEncountered(context: AppContext): boolean {
    return context.events.isCompleted('b5_child_resistance_encounter')
  }
}