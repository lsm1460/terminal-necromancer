import { TargetSelector } from '~/core/battle/TargetSelector'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'

/**
 * 뼈 감옥 (Bone Prison)
 * : 대지에서 솟아오르는 뼈의 창살로 적 1명을 가둡니다.
 * : 대상에게 '뼈 감옥' [속박] 상태를 3턴 동안 부여합니다.
 */
export const bonePrison: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  if (aliveEnemies.length === 0) {
    Terminal.log(i18n.t('skill.BONE_PRISON.no_targets'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 1. 대상 선택
  const { choices } = new TargetSelector(aliveEnemies)
    .excludeStealth()
    .excludeIf((u) => u.deBuff.some((d) => d.id === 'bone_prison'), i18n.t('skill.BONE_PRISON.already_trapped'))
    .build()

  const targetId = await Terminal.select(i18n.t('skill.BONE_PRISON.select_prompt'), [
    ...choices,
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  if (targetId === 'cancel') {
    Terminal.log(i18n.t('skill.BONE_PRISON.cancel_msg'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const target = aliveEnemies.find((e) => e.id === targetId)
  if (!target) {
    Terminal.log(i18n.t('skill.BONE_PRISON.no_target_found'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 디버프 부여
  const duration = 3

  target.applyDeBuff({
    id: 'bone_prison',
    type: 'bind',
    duration: duration + 1,
  })

  Terminal.log(i18n.t('skill.BONE_PRISON.success_log', { target: target.name, duration }))

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 40,
  }
}
