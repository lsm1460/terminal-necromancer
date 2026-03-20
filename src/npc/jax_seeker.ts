import { MAP_IDS } from '~/consts'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const JaxHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(context)

    // 가입 전이라면 가입(퀘스트) 선택지만 반환
    if (quest) {
      return [quest]
    }

    // 가입 후라면 일반 대화와 입장 선택지 반환
    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'enter', message: i18n.t('npc.jax_seeker.choices.enter') },
    ]
  },

  hasQuest(player, npc, context) {
    return getActiveQuest(context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'enter':
        await handleEnter(player, context)
        break
      case 'join':
        return await handleJoin(player, npc, context)
      default:
        break
    }
  },
}

async function handleJoin(player: Player, npc: NPC, context: GameContext) {
  const { map, events, battle } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  const dialogues = i18n.t('npc.jax_seeker.join.dialogues', { returnObjects: true }) as string[]

  // 1. 순차적 대화 노출
  await speak(dialogues)

  // 2. 최종 선택
  const choice = (await Terminal.select(i18n.t('npc.jax_seeker.join.select_title'), [
    { message: i18n.t('npc.jax_seeker.join.options.join'), name: 'join' },
    { message: i18n.t('npc.jax_seeker.join.options.kill'), name: 'kill' },
    { message: i18n.t('npc.jax_seeker.join.options.leave'), name: 'leave' },
  ])) as 'join' | 'kill' | 'leave'

  // 3. 결과 처리
  switch (choice) {
    case 'join':
      Terminal.log(i18n.t('npc.jax_seeker.join.result_join'))
      events.completeEvent('RESISTANCE_BASE')

      const goToBase = await Terminal.confirm(i18n.t('npc.jax_seeker.join.confirm_move'))

      if (goToBase) {
        handleEnter(player, context)
        return
      } else {
        Terminal.log(i18n.t('npc.jax_seeker.join.stay_msg'))
      }
      break

    case 'kill':
      Terminal.log(i18n.t('npc.jax_seeker.join.result_kill_jax'))
      Terminal.log(i18n.t('npc.jax_seeker.join.result_kill_player'))
      const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], context)

      if (isWin) {
        events.completeEvent('RESISTANCE_BASE')
        npc.updateHostility(40)
      } else {
        npc.updateHostility(10)
      }

      tile.isClear = true
      return true

    case 'leave':
      Terminal.log(i18n.t('npc.jax_seeker.join.result_leave'))
      break
  }
}

async function handleEnter(player: Player, context: GameContext) {
  const { map } = context
  Terminal.log(i18n.t('npc.jax_seeker.enter.log'))
  await map.changeScene(MAP_IDS.B3_5_RESISTANCE_BASE, player)
}

function getActiveQuest(context: GameContext) {
  const isJoined = context.events.isCompleted('RESISTANCE_BASE')

  if (!isJoined) {
    return { name: 'join', message: i18n.t('talk.small_talk') }
  }

  return null
}

export default JaxHandler
