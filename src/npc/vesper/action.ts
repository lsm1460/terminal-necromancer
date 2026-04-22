import { GameContext } from '~/core/types'
import { NPC } from '~/types'
import { KaelActions } from '../kael/action'

export const VesperActions = {
  /** * 어린이 저항군 발견 이벤트 
   * 로직의 일관성을 위해 카엘의 발견 액션을 공유하여 호출합니다.
   */
  async handleDiscovery(npc: NPC, context: GameContext) {
    return await KaelActions.handleDiscovery(npc, context)
  }
}