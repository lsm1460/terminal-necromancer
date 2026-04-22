import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { SubspaceService } from '../service'

export const handleIncreaseLimit = async (context: GameContext) => {
  const { player, events } = context
  const necromancer = player as Necromancer
  const { currentLimit, isMax, cost } = SubspaceService.getUpgradeInfo(necromancer)

  const scriptKey = events.isCompleted('caron_is_dead') ? 'caron_is_dead' : 'caron_is_mine'
  const t = (key: string) => i18n.t(`npc.subspace.increase_limit.${scriptKey}.${key}`)

  if (isMax) {
    Terminal.log(`\n${t('max')}`)
    return
  }

  Terminal.log(`\n${t('cost_info')}`)
  Terminal.log(i18n.t('npc.subspace.increase_limit.status', { current: necromancer.exp, cost }))

  if (necromancer.exp < cost) {
    Terminal.log(`\n${t('not_enough')}`)
    return
  }

  if (!(await Terminal.confirm(t('confirm')))) {
    Terminal.log(`\n${t('cancel')}`)
    return
  }

  necromancer.exp -= cost
  necromancer._maxSkeleton = currentLimit + 1

  Terminal.log(i18n.t('npc.subspace.increase_limit.success_title'))
  Terminal.log(t('success'))
  Terminal.log(i18n.t('npc.subspace.increase_limit.result', { prev: currentLimit, next: necromancer._maxSkeleton }))
}
