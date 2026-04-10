import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext } from '~/types'
import { SubspaceService } from '../service'

export const handleIncreaseLimit = async (context: GameContext) => {
  const { player, events } = context
  const { currentLimit, isMax, cost } = SubspaceService.getUpgradeInfo(player)

  const scriptKey = events.isCompleted('caron_is_mine') ? 'caron_is_mine' : 'caron_is_dead'
  const t = (key: string) => i18n.t(`npc.subspace.increase_limit.${scriptKey}.${key}`)

  if (isMax) {
    Terminal.log(`\n${t('max')}`)
    return
  }

  Terminal.log(`\n${t('cost_info')}`)
  Terminal.log(i18n.t('npc.subspace.increase_limit.status', { current: player.exp, cost }))

  if (player.exp < cost) {
    Terminal.log(`\n${t('not_enough')}`)
    return
  }

  if (!(await Terminal.confirm(t('confirm')))) {
    Terminal.log(`\n${t('cancel')}`)
    return
  }

  player.exp -= cost
  player._maxSkeleton = currentLimit + 1

  Terminal.log(i18n.t('npc.subspace.increase_limit.success_title'))
  Terminal.log(t('success'))
  Terminal.log(i18n.t('npc.subspace.increase_limit.result', { prev: currentLimit, next: player._maxSkeleton }))
}
