import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
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

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'donation', message: i18n.t('npc.kane_leader.choice.donation') },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'join':
        await handleJoin(player, npc, context)
        break
      case 'talk':
        handleTalk(npc)
        break
      case 'donation':
        handleDonation(player, npc)
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

  npc.updateContribution(20)

  events.completeEvent('kane_1')
}

async function handleDonation(player: Player, npc: NPC) {
  const playerGold = player.gold
  const contribution = npc.factionContribution

  let statusKey = 'stranger'
  if (contribution >= 100) statusKey = 'pillar'
  else if (contribution >= 50) statusKey = 'member'

  Terminal.log(`\n${i18n.t(`npc.kane_leader.status_lines.${statusKey}`)}`)

  if (playerGold <= 0) {
    Terminal.log(`\n${i18n.t('npc.kane_leader.no_gold_flavor')}`)
    return
  }

  const donationPercentages = [10, 30, 50, 80]
  const choices = donationPercentages
    .map((percent) => {
      const amount = Math.floor(playerGold * (percent / 100))
      if (amount <= 0) return null
      return {
        name: amount.toString(),
        message: i18n.t('npc.kane_leader.donation.option', {
        percent,
        amount: amount.toLocaleString()
      }),
      }
    })
    .filter(Boolean) as { name: string; message: string }[]

  choices.push({ name: 'cancel', message: i18n.t('cancel') })

  const selectedAmountStr = await Terminal.select(i18n.t('npc.kane_leader.contribute_prompt'), choices)

  if (selectedAmountStr === 'cancel') return

  const donationAmount = parseInt(selectedAmountStr)

  const contributionGain = Math.max(Math.floor(donationAmount / 100), 1)

  player.gold -= donationAmount
  npc.updateContribution(contributionGain)

  let reactionKey = 'small'
  if (donationAmount >= 4000) reactionKey = 'large'
  else if (donationAmount >= 1000) reactionKey = 'medium'

  const reactions = i18n.t(`npc.kane_leader.reaction.${reactionKey}`, { returnObjects: true }) as string[]
  const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]

  Terminal.log(`\n${randomReaction}`)
  Terminal.log(
    i18n.t('npc.kane_leader.donation.result', {
      gain: contributionGain,
      gold: player.gold.toLocaleString(), // 숫자에 천 단위 콤마 추가
    })
  )
}

export default KaneHandler
