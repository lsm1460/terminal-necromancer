import { TargetSelector } from '~/core/battle/TargetSelector'
import { Terminal } from '~/core/Terminal'
import { ExecuteSkill } from '~/core/types'
import i18n from '~/i18n'

/**
 * 표식 (Curse)
 * - 일반: 미니언들의 공격 대상을 지정합니다.
 */
export const focusFire: ExecuteSkill = async (player, skillContext, { enemies = [] } = {}) => {
  const duration = 3
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)
  const curseName = i18n.t('skill.FOCUS_FIRE.name')

  if (aliveEnemies.length === 0) {
    Terminal.log(i18n.t('skill.FOCUS_FIRE.no_target'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  try {
    // --- 2. 단일 타겟 선택 ---
    const { choices } = new TargetSelector(aliveEnemies)
      .excludeStealth()
      .labelIf(
        (e) => e.deBuff.some((d) => d.id === 'focus'), // ID 기반 체크 권장
        i18n.t('skill.FOCUS_FIRE.already_marked', { curse: curseName })
      )
      .build()

    const targetId = await Terminal.select(i18n.t('skill.FOCUS_FIRE.select_prompt'), [
      ...choices,
      { name: 'cancel', message: i18n.t('cancel') },
    ])

    if (targetId === 'cancel') return { isSuccess: false, isAggressive: false, gross: 0 }

    const target = aliveEnemies.find((e) => e.id === targetId)
    if (!target) return { isSuccess: false, isAggressive: false, gross: 0 }

    // 연출 로그 출력
    Terminal.log(
      i18n.t('skill.FOCUS_FIRE.activation', {
        player: player.name,
        target: target.name,
      })
    )
    Terminal.log(i18n.t('skill.FOCUS_FIRE.minion_reaction'))

    target.applyDeBuff({
      id: 'focus',
      type: 'focus',
      duration: duration + 1,
    })

    return {
      isSuccess: true,
      isAggressive: true,
      gross: 90,
    }
  } catch (error) {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }
}
