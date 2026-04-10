import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'
import { SkillManager } from '../SkillManager'

/**
 * 영혼 흡수: 적 대상으로부터 정수를 추출하여 마나(또는 체력)를 회복
 * : VAMPIRISM 어픽스가 있다면 체력을 20% 회복합니다.
 */
export const soulHarvest: ExecuteSkill = async (player, { world }) => {
  const isVampirism = player.ref.hasAffix('VAMPIRISM')

  // 1. 대상 시체 선택
  const targetId = await SkillManager.selectCorpse(player.ref, world)
  if (!targetId || targetId === 'cancel') {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const corpses = world.getCorpsesAt(player.ref.pos)
  const selectedCorpse = corpses.find((c) => c.id === targetId)

  if (!selectedCorpse) {
    Terminal.log(i18n.t('skill.not_found'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const restoreResult = handleRestore(player, isVampirism)

  if (restoreResult.actualRestored <= 0) {
    Terminal.log(i18n.t('skill.SOUL_HARVEST.full', { type: restoreResult.type }))

    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 3. 성공 로그 및 시체 제거
  Terminal.log(
    i18n.t('skill.SOUL_HARVEST.success', {
      name: selectedCorpse.name,
      amount: restoreResult.actualRestored,
      type: restoreResult.type,
    })
  )

  world.removeCorpse(selectedCorpse.id)

  return {
    isSuccess: true,
    isAggressive: false,
    gross: 30,
  }
}

function handleRestore(player: CombatUnit<Player>, isVampirism: boolean): { type: string; actualRestored: number } {
  const p = player.ref

  if (isVampirism) {
    // 체력 회복 (최대 체력의 20%)
    const restoreAmount = Math.floor(p.maxHp * 0.2)
    const previous = p.hp
    p.hp = Math.min(p.maxHp, p.hp + restoreAmount)

    return { type: 'HP', actualRestored: p.hp - previous }
  } else {
    // 마나 회복 (고정 20)
    const restoreAmount = 20
    const previous = p.mp
    p.mp = Math.min(p.maxMp, p.mp + restoreAmount)

    return { type: 'MP', actualRestored: p.mp - previous }
  }
}
