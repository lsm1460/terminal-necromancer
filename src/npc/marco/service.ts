import i18n from '~/i18n'
import { AppContext } from '~/systems/types'

export const MarcoService = {
  getActiveQuest(context: AppContext) {
    const { events } = context
    const talk1 = !events.isCompleted('talk_marco_1')
    const talk2 = events.isCompleted('first_boss') && !events.isCompleted('talk_marco_2')
    const talk3 = events.isCompleted('RESISTANCE_BASE') && !events.isCompleted('talk_marco_3')
    const talk4 = events.isCompleted('second_boss') && !events.isCompleted('talk_marco_4')
    const talk5 = events.isCompleted('report_caron_to_death') && !events.isCompleted('talk_marco_5')
    const talk6 = events.isCompleted('talk_death_4') && !events.isCompleted('talk_marco_6')
    const talk7 = events.isCompleted('fourth_boss') && !events.isCompleted('talk_marco_7')

    if (talk7) {
      return { name: 'talk7', message: i18n.t('talk.speak') }
    }
    if (talk6) {
      return { name: 'talk6', message: i18n.t('talk.speak') }
    }
    if (talk5) {
      return { name: 'talk5', message: i18n.t('talk.speak') }
    }
    if (talk4) {
      return { name: 'talk4', message: i18n.t('talk.speak') }
    }
    if (talk3) {
      return { name: 'talk3', message: i18n.t('talk.speak') }
    }
    if (talk2) {
      return { name: 'talk2', message: i18n.t('talk.speak') }
    }
    if (talk1) {
      return { name: 'talk1', message: i18n.t('talk.speak') }
    }
    
    return null
  },
}