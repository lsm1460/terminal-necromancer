import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { NPC } from '~/types'
import { speak } from '~/utils'
import { KaneService } from './service'

export const KaneActions = {
  /** 저항군 합류 대화 */
  async handleJoin(npc: NPC, context: GameContext) {
    const { npcs, events } = context
    const jax = npcs.getNPC('jax_seeker')
    const jaxSuffix = jax?.isAlive ? 'jax_alive' : 'jax_dead'

    const dialogues = [
      ...(i18n.t('npc.kane_leader.join.intro', { returnObjects: true }) as string[]),
      ...(i18n.t(`npc.kane_leader.join.${jaxSuffix}`, { returnObjects: true }) as string[]),
      ...(i18n.t('npc.kane_leader.join.proposition', { returnObjects: true }) as string[])
    ]

    await speak(dialogues)
    npc.updateContribution(20)
    events.completeEvent('kane_1')
  },

  /** 기부 시스템 */
  async handleDonation(npc: NPC, context: GameContext) {
    const { player } = context
    const statusKey = KaneService.getStatusKey(npc.factionContribution)

    Terminal.log(`\n${i18n.t(`npc.kane_leader.status_lines.${statusKey}`)}`)

    if (player.gold <= 0) {
      Terminal.log(`\n${i18n.t('npc.kane_leader.no_gold_flavor')}`)
      return
    }

    const choices = [10, 30, 50, 80]
      .map(percent => {
        const amount = Math.floor(player.gold * (percent / 100))
        return amount > 0 ? { name: amount.toString(), message: i18n.t('npc.kane_leader.donation.option', { percent, amount: amount.toLocaleString() }) } : null
      })
      .filter(Boolean) as { name: string; message: string }[]

    choices.push({ name: 'cancel', message: i18n.t('cancel') })

    const selected = await Terminal.select(i18n.t('npc.kane_leader.contribute_prompt'), choices)
    if (selected === 'cancel') return

    const amount = parseInt(selected)
    const gain = Math.max(Math.floor(amount / 100), 1)

    player.gold -= amount
    npc.updateContribution(gain)

    const reactionKey = amount >= 4000 ? 'large' : amount >= 1000 ? 'medium' : 'small'
    const reactions = i18n.t(`npc.kane_leader.reaction.${reactionKey}`, { returnObjects: true }) as string[]
    
    Terminal.log(`\n${reactions[Math.floor(Math.random() * reactions.length)]}`)
    Terminal.log(i18n.t('npc.kane_leader.donation.result', { gain, gold: player.gold.toLocaleString() }))
  },

  /** B5 작전 브리핑 */
  async handleBriefing(npc: NPC, context: GameContext) {
    const lines = [
      ...(i18n.t('npc.kane_leader.b5_operation.intro', { returnObjects: true }) as string[]),
      ...(i18n.t('npc.kane_leader.b5_operation.plan', { returnObjects: true }) as string[]),
      ...(i18n.t('npc.kane_leader.b5_operation.desperate', { returnObjects: true }) as string[])
    ]

    await speak(lines)
    npc.updateContribution(20)
    context.events.completeEvent('kane_2')
  }
}