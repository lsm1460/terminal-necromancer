import { speak } from '~/utils'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { printTileStatus } from '~/statusPrinter'

export const OliverActions = {
  /**
   * 올리버의 유언 이벤트 실행 및 사망 처리
   */
  async handleLastWords(npc: NPC, context: GameContext) {
    const { player, events, world } = context
    
    // 1. 유언 재생
    const dialogues = i18n.t('npc.oliver.last_words', { returnObjects: true }) as string[]
    await speak(dialogues)

    // 2. 이벤트 완료 및 사망 처리
    events.completeEvent('b5_oliver')
    npc.dead({ karma: 0 })

    // 3. 월드에 시체 안치
    world.addCorpse({
      ...npc,
      ...player.pos,
    })

    // 4. 타일 상태 갱신 출력
    printTileStatus(context)
    
    return true
  }
}