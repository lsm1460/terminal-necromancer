import { speak } from '~/utils'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { printTileStatus } from '~/core/statusPrinter'

export const OliverActions = {
  /**
   * 올리버의 유언 이벤트 실행 및 사망 처리
   */
  async handleLastWords(npc: NPC, context: GameContext) {
    const { player, events, world } = context

    const dialogues = i18n.t('npc.oliver.last_words', { returnObjects: true }) as string[]
    await speak(dialogues)

    events.completeEvent('b5_oliver')
    npc.dead({ karma: 0 })

    world.addCorpse({
      maxHp: npc.maxHp,
      atk: npc.atk,
      def: npc.def,
      agi: npc.agi,
      name: npc.name,
      id: npc.id,
      minRebornRarity: npc.minRebornRarity,
      ...player.pos,
    })

    printTileStatus(context)

    return true
  },
}
