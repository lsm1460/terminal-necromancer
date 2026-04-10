import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { KaelService } from './service'

export const KaelActions = {
  /** 어린이 저항군 조우 이벤트 실행 */
  async handleDiscovery(npc: NPC, context: GameContext) {
    const { events } = context

    // 1. 초기 대화 재생
    await speak(i18n.t('npc.kael.encounter.dialogue', { returnObjects: true }) as string[])

    // 2. 대응 선택
    const choice = await Terminal.select(i18n.t('npc.kael.encounter.select_title'), [
      { name: 'flint_friend', message: i18n.t('npc.kael.encounter.choice_friend') },
      { name: 'intimidate', message: i18n.t('npc.kael.encounter.choice_intimidate') },
    ])

    if (choice === 'flint_friend') {
      if (KaelService.canPersuade(npc)) {
        await speak(i18n.t('npc.kael.encounter.result_friend_success', { returnObjects: true }) as string[])
      } else {
        await speak(i18n.t('npc.kael.encounter.result_friend_fail', { returnObjects: true }) as string[])
        return await startAmbushBattle(npc, context)
      }
    } else {
      await speak(i18n.t('npc.kael.encounter.result_intimidate', { returnObjects: true }) as string[])
      return await startAmbushBattle(npc, context)
    }

    events.completeEvent('b5_child_resistance_encounter')
    return true
  },
}

/** 카엘 & 베스퍼 연합 전투 실행 */
async function startAmbushBattle(npc: NPC, context: GameContext) {
  const { battle, npcs, events, map, player, world } = context
  const tile = map.getTile(player.pos)

  const kael = npcs.getNPC('kael')
  const vesper = npcs.getNPC('vesper')

  const kUnit = battle.toCombatUnit(kael!, 'npc')
  const vUnit = battle.toCombatUnit(vesper!, 'npc')

  const isWin = await battle.runCombatLoop([kUnit, vUnit], world)

  npc.updateHostility(isWin ? 40 : 10)
  events.completeEvent('b5_child_resistance_encounter')
  tile.isClear = true
  return true
}
