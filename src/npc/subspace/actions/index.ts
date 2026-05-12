import { EventLedger } from '~/core/EventLedger'
import i18n from '~/i18n'
import { speak } from '~/utils'

export * from './limit'
export * from './manage'
export * from './mix'
export * from './promotion'

export const handleJoinFinalBattle = async (_events: EventLedger) => {
  await speak(i18n.t('npc.subspace.join_fray', { returnObjects: true }) as string[])

  _events.completeEvent('join_caron')
}
