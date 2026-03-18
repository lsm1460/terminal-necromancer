import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'

export const recallSkeleton: ExecuteSkill = async (player, context) => {
  const skeletons = player.ref.skeleton

  const corpseId = await Terminal.select(i18n.t('skill.RECALL_SKELETON.select_prompt'), [
    ...skeletons.map((s) => ({
      name: s.id,
      message: `${s.name} (${s.hp}/${s.maxHp})`,
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  if (corpseId === 'cancel') {
    Terminal.log('\n💬 ' + i18n.t('skill.cancel_action'))
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  // 2. 대상 탐색
  const selectedSkeleton = skeletons.find((target) => target.id === corpseId)

  if (!selectedSkeleton) {
    Terminal.log(i18n.t('skill.not_found'))
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  // 3. 상태 업데이트 및 자원 회수
  selectedSkeleton.hp = 0
  selectedSkeleton.isAlive = false

  player.ref.removeMinion(selectedSkeleton.id)
  player.ref.mp = Math.min(player.ref.mp + 5, player.ref.maxMp)

  // 4. 결과 출력
  Terminal.log(i18n.t('skill.RECALL_SKELETON.success', { name: selectedSkeleton.name || 'Skeleton' }))
  Terminal.log(i18n.t('skill.RECALL_SKELETON.resource_gain', { mp: player.ref.mp }))

  return {
    isSuccess: true,
    isAggressive: false,
    gross: 30,
  }
}
