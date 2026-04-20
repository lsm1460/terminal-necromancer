import { TargetSelector } from '~/core/battle/TargetSelector'
import { Terminal } from '~/core/Terminal'
import { ExecuteSkill } from '~/core/types'
import i18n from '~/i18n'

/**
 * 저주 (Curse)
 * - 일반: 공격력 5% 감소 (나머지 버림)
 * - 부식(CORROSION): 방어력 5% 감소 (나머지 버림) ※ 공격력 감소는 적용 안 함
 * - 광역(WIDE_CURSE): 모든 생존한 적에게 적용
 */
export const curse: ExecuteSkill = async (player, skillContext, { enemies = [] } = {}) => {
  const duration = 3
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  const isCorrosion = player.ref.hasAffix('CORROSION')
  const isWide = player.ref.hasAffix('WIDE_CURSE')

  const curseName = isCorrosion ? i18n.t('skill.CURSE.corrosion_name') : i18n.t('skill.CURSE.name')
  const displayName = isWide ? `${i18n.t('skill.CURSE.wide_prefix')}${curseName}` : curseName

  if (aliveEnemies.length === 0) {
    Terminal.log(i18n.t('skill.CURSE.no_target', { display: displayName }))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 실제 디버프 적용 함수
  const applyCurse = (target: any) => {
    const atkReduction = !isCorrosion ? Math.max(Math.floor(target.stats.atk * 0.2), 1) : 0
    const defReduction = isCorrosion ? Math.max(Math.floor(target.stats.def * 0.3), 1) : 0

    target.applyDeBuff({
      id: isCorrosion ? 'corrosion' : 'curse',
      type: 'deBuff',
      ...(isCorrosion ? { def: defReduction } : { atk: atkReduction }),
      duration: duration + 1,
    })

    // 로그 출력
    Terminal.log(
      i18n.t('skill.CURSE.effect_detail', {
        target: target.name,
        stat: isCorrosion ? i18n.t('skill.CURSE.stat_def') : i18n.t('skill.CURSE.stat_atk'),
        value: isCorrosion ? defReduction : atkReduction,
        duration: duration,
      })
    )
  }

  try {
    if (isWide) {
      Terminal.log(i18n.t('skill.CURSE.wide_activation', { player: player.name, display: displayName }))
      aliveEnemies.forEach((enemy) => applyCurse(enemy))
      return { isSuccess: true, isAggressive: true, gross: 120 }
    }

    const { choices } = new TargetSelector(aliveEnemies)
      .excludeStealth()
      .labelIf(
        (e) => e.deBuff.some((d) => d.id === (isCorrosion ? 'corrosion' : 'curse')),
        i18n.t('skill.CURSE.already_status', { status: curseName })
      )
      .build()

    const targetId = await Terminal.select(i18n.t('skill.CURSE.select_prompt', { display: displayName }), [
      ...choices,
      { name: 'cancel', message: i18n.t('cancel') },
    ])

    if (targetId === 'cancel') return { isSuccess: false, isAggressive: false, gross: 0 }

    const target = aliveEnemies.find((e) => e.id === targetId)
    if (!target) return { isSuccess: false, isAggressive: false, gross: 0 }

    Terminal.log(
      i18n.t('skill.CURSE.single_activation', {
        player: player.name,
        target: target.name,
        display: curseName,
      })
    )
    applyCurse(target)

    return { isSuccess: true, isAggressive: true, gross: 90 }
  } catch (error) {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }
}
