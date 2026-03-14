import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const KaneHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isJoined = context.events.isCompleted('RESISTANCE_BASE')
    const isAlreadyMet = context.events.isCompleted('kane_1')

    if (isJoined && !isAlreadyMet) {
      return [{ name: 'join', message: i18n.t('talk.speak') }]
    }

    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'join':
        await handleJoin(player, npc, context)
        break
      case 'talk':
        handleTalk(npc)
        break
      default:
        break
    }
  },
}

async function handleJoin(player: Player, npc: NPC, context: GameContext) {
  const { npcs, events } = context

  const jax = npcs.getNPC('jax_seeker')
  const jaxIsAlive = jax?.isAlive

  let dialogues: string[] = i18n.t('npc.kane_leader.join.intro', { returnObjects: true }) as string[]

  // 2. 잭스 상태에 따른 분기
  if (!jaxIsAlive) {
    dialogues = [...dialogues, ...(i18n.t('npc.kane_leader.join.jax_dead', { returnObjects: true }) as string[])]
  } else {
    dialogues = [...dialogues, ...(i18n.t('npc.kane_leader.join.jax_alive', { returnObjects: true }) as string[])]
  }

  // 3. 제안 및 마무리 대화 합치기
  dialogues = [...dialogues, ...(i18n.t('npc.kane_leader.join.proposition', { returnObjects: true }) as string[])]

  await speak(dialogues)

  events.completeEvent('kane_1')
}

export default KaneHandler
