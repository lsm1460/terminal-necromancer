import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { delay } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const FlintHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(context)

    if (quest) {
      return [quest]
    }

    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  },

  hasQuest(player, context) {
    // getActiveQuest의 존재 여부에 따라 NPC 머리 위의 [!] 여부가 결정됩니다.
    return getActiveQuest(context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        return await handleEvent(npc, player, context)
      default:
        break
    }
  },
}

async function handleEvent(flint: NPC, player: Player, context: GameContext) {
  const { battle, map, drop } = context
  const tile = map.getTile(player.pos.x, player.pos.y)
  const descColor = '\x1b[36m'

  // --- [STAGE 1: 환경 묘사 및 독백] ---
  const initialScript = i18n.t('npc.flint.encounter.initial_script', { returnObjects: true }) as {
    delay?: number
    name?: string
    text: string
  }[]

  for (const line of initialScript) {
    if (!line.name) {
      Terminal.log(`  ${descColor}${line.text}\x1b[0m`)
    } else {
      Terminal.log(`${line.name}: "${line.text}"`)
    }
    await delay(line.delay || 1500) // 기본 딜레이 설정
  }

  // --- [STAGE 2: 첫 번째 분기] ---
  const mainChoice = await Terminal.select(i18n.t('npc.flint.encounter.select_action'), [
    { name: 'ask_situation', message: i18n.t('npc.flint.encounter.choice_ask') },
    { name: 'surprise_attack', message: i18n.t('npc.flint.encounter.choice_surprise') },
  ])

  if (mainChoice === 'surprise_attack') {
    Terminal.log(`  \x1b[31m${i18n.t('npc.flint.encounter.surprise_attack_msg')}\x1b[0m`)
    await delay(1000)
    Terminal.log(i18n.t('npc.flint.encounter.surprise_attack_reply'))

    const isWin = await battle.runCombatLoop([battle.toCombatUnit(flint, 'npc')], context)
    flint.updateHostility(isWin ? 40 : 10)
    tile.isClear = true
    return true
  }

  if (mainChoice === 'ask_situation') {
    Terminal.log(i18n.t('npc.flint.encounter.ask_reply_1'))
    await delay(1000)
    Terminal.log(i18n.t('npc.flint.encounter.ask_reply_2'))

    // --- [STAGE 3: 두 번째 분기] ---
    const finalDecision = await Terminal.select(i18n.t('npc.flint.encounter.select_final'), [
      { name: 'join', message: i18n.t('npc.flint.encounter.choice_join') },
      { name: 'refuse', message: i18n.t('npc.flint.encounter.choice_refuse') },
    ])

    if (finalDecision === 'join') {
      Terminal.log(i18n.t('npc.flint.encounter.result_join'))
      const { drops: goods } = drop.generateDrops('b5_flint_medical_kit')
      flint.updateContribution(25)
      player.addItem(goods[0])
      player.karma += 5
    } else {
      Terminal.log(i18n.t('npc.flint.encounter.result_refuse'))
      flint.updateContribution(-20)
      flint.updateHostility(30)
    }
  }

  context.events.completeEvent('b5_flint')
}

function getActiveQuest(context: GameContext) {
  const { events } = context
  const alreadyTalk = events.isCompleted('b5_flint')

  if (!alreadyTalk) {
    return { name: 'event', message: i18n.t('talk.examine') }
  }

  return null
}

export default FlintHandler
