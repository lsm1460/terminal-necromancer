import { GameContext } from '~/types'
import { Terminal } from '~/core/Terminal'
import { speak } from '~/utils'
import i18n from '~/i18n'

export const StoryActions = {
  async handleIntro(context: GameContext) {
    const { events } = context
    const isFirst = events.isCompleted('talk_death_1')
    const isB2Completed = events.isCompleted('first_boss')

    if (isFirst && !isB2Completed) {
      Terminal.log(`\n${i18n.t('npc.death.intro.still_working')}`)
      return true
    }

    const dialogues = i18n.t('npc.death.intro.dialogues', { returnObjects: true }) as string[]
    await speak(dialogues)
    
    Terminal.log(`\n${i18n.t('npc.death.intro.failure_threat')}`)
    events.completeEvent('talk_death_1')
    return true
  },

  async handleTutorialOver(context: GameContext) {
    const { events } = context
    const messages = i18n.t('npc.death.tutorial_over', { returnObjects: true }) as string[]
    
    await speak(messages)
    events.completeEvent('talk_death_2')
    return true
  },

  async handleDefeatGolem(context: GameContext) {
    const { events } = context
    const messages = i18n.t('npc.death.defeat_golem', { returnObjects: true }) as string[]
    
    await speak(messages)
    events.completeEvent('talk_death_3')
    return true
  },

  async handleReportCaron(context: GameContext) {
    const { events } = context
    const isCaronMine = events.isCompleted('caron_is_mine')
    const isCaronDead = events.isCompleted('caron_is_dead')

    let messageKey = ''
    if (isCaronMine) {
      messageKey = 'npc.death.report_caron.deceived'
    } else if (isCaronDead) {
      messageKey = 'npc.death.report_caron.loyal'
    }

    if (messageKey) {
      const messages = i18n.t(messageKey, { returnObjects: true }) as string[]
      await speak(messages)
    }

    // 공통 후속 대사 (B5로 가라는 명령)
    await speak(i18n.t('npc.death.report_caron.order_go_to_b5', { returnObjects: true }) as string[])
    
    events.completeEvent('report_caron_to_death')
    return true
  },

  async handleAfterCleanup(context: GameContext) {
    const { events } = context
    const isVipLost = events.isCompleted('third_boss_resistance') || events.isCompleted('third_boss_kill_all')

    if (!isVipLost) {
      await speak(i18n.t('npc.death.report_vips_saved', { returnObjects: true }) as string[])
      events.completeEvent('vips_saved')
    } else {
      await speak(i18n.t('npc.death.report_vips_lost', { returnObjects: true }) as string[])
      events.completeEvent('vips_lost')
    }

    events.completeEvent('talk_death_4')
    return true
  }
}