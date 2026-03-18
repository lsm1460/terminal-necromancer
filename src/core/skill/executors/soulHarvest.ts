import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'
import { SkillManager } from '../SkillManager'

/**
 * 영혼 흡수: 적 대상으로부터 정수를 추출하여 마나를 회복
 */
export const soulHarvest: ExecuteSkill = async (player, context) => {
  const { world } = context
  const { x, y } = player.ref.pos

  // 1. 대상 시체 선택
  const targetId = await SkillManager.selectCorpse(player.ref, context)
  const corpses = world.getCorpsesAt(x, y)
  const selectedCorpse = corpses.find((c) => c.id === targetId)

  if (!selectedCorpse) {
    Terminal.log(i18n.t('skill.not_found'))
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  // 2. 수치 결정 및 자원 회복 처리
  const restoreAmount = 20 // 기본 마나 회복량
  const previousMp = player.ref.mp
  player.ref.mp = Math.min(player.ref.maxMp, player.ref.mp + restoreAmount)
  const actualRestored = player.ref.mp - previousMp

  // 3. 결과 연출 로그
  if (actualRestored > 0) {
    Terminal.log(
      i18n.t('skill.SOUL_HARVEST.success', {
        name: selectedCorpse.name,
        amount: actualRestored,
      })
    )
  } else {
    Terminal.log(i18n.t('skill.SOUL_HARVEST.full_mana'))
  }

  // 4. 사용한 시체 제거
  world.removeCorpse(selectedCorpse.id)

  return {
    isSuccess: true,
    isAggressive: false,
    gross: 30,
  }
}
