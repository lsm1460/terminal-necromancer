import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const KaelHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_child_resistance_encounter')

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    } else {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        return await handleChildResistanceDiscovery(player, npc, context)
      default:
        break
    }
  },
}

export async function handleChildResistanceDiscovery(player: Player, npc: NPC, context: GameContext) {
  const { battle, map, npcs, events } = context
  
  const tile = map.getTile(player.pos.x, player.pos.y)

  const battleWith = async () => {
    const kael = npcs.getNPC('kael')
    const vesper = npcs.getNPC('vesper')
    const kUnit = battle.toCombatUnit(kael!, 'npc')
    const vUnit = battle.toCombatUnit(vesper!, 'npc')

    const isWin = await battle.runCombatLoop([kUnit, vUnit], context)

    npc.updateHostility(isWin ? 40 : 10)
    events.completeEvent('b5_child_resistance_encounter')
    tile.isClear = true
    return true
  }

  // 초기 대화 재생
  await speak(i18n.t('npc.kael.encounter.dialogue', { returnObjects: true }) as string[])

  // 대응 선택
  const choice = await Terminal.select(i18n.t('npc.kael.encounter.select_title'), [
    { name: 'flint_friend', message: i18n.t('npc.kael.encounter.choice_friend') },
    { name: 'intimidate', message: i18n.t('npc.kael.encounter.choice_intimidate') },
  ])
  
  switch (choice) {
    case 'flint_friend':
      if (npc.factionContribution >= 20) {
        await speak(i18n.t('npc.kael.encounter.result_friend_success', { returnObjects: true }) as string[])
      } else {
        await speak(i18n.t('npc.kael.encounter.result_friend_fail', { returnObjects: true }) as string[])
        return await battleWith()
      }
      break

    case 'intimidate':
      await speak(i18n.t('npc.kael.encounter.result_intimidate', { returnObjects: true }) as string[])
      return await battleWith()
  }

  events.completeEvent('b5_child_resistance_encounter')
}

export default KaelHandler
