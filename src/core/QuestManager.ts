import { GameContext, NPC } from '~/types'
import { Player } from './player/Player'
import npcHandlers from '~/npc'

export class QuestManager {
  static hasQuest(player: Player, npc: NPC, context: GameContext): boolean {
    const handler = npcHandlers[npc.id]
    if (!handler) return false

    // 1. 핸들러에 명시적으로 hasQuest가 구현되어 있다면 사용
    if (handler.hasQuest) {
      return handler.hasQuest(player, npc, context)
    }

    // 2. 기본 구현: getChoices에서 'talk.small_talk' 외의 선택지가 있는지 확인
    // (이 방식은 범용적이지만, NPC에 따라 '레벨업' 등 상시 메뉴를 퀘스트로 오인할 수 있으므로
    // 명시적인 hasQuest 구현을 권장함)
    const choices = handler.getChoices(player, npc, context)
    
    // 일반적인 메뉴(잡담, 구매, 판매 등)를 제외한 특별한 선택지가 있는지 확인
    const commonActions = ['talk', 'buy', 'sell', 'levelUp', 'unlock', 'memorize', 'heal']
    return choices.some(choice => !commonActions.includes(choice.name))
  }
}
