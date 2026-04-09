import { GameContext } from '~/types'

export const VesperService = {
  /** 어린이 저항군 조우 이벤트 완료 여부 (카엘과 공유) */
  isEncountered(context: GameContext): boolean {
    return context.events.isCompleted('b5_child_resistance_encounter')
  }
}