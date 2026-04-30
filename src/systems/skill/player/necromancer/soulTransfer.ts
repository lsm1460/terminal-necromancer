import { ExecuteSkill, Terminal } from '~/core'
import i18n from '~/i18n'
import { IMinion } from '~/types'

/**
 * 영혼 전달 (Soul Transfer)
 * : 플레이어와 미니언 간의 영혼 에너지를 공명시킵니다.
 * : [기본] 미니언 치유
 * : [어픽스: EMPOWER_SOUL] 미니언 공격력 버프 부여 + 체력 감소
 */
export const soulTransfer: ExecuteSkill = async (player, skillContext, { ally = [], enemies } = {}) => {
  const minions = ally.filter((target) => (target.ref as IMinion).isMinion)

  // 1. 소환수 존재 여부 체크
  if (minions.length === 0) {
    Terminal.log(i18n.t('skill.SOUL_TRANSFER.no_minions'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 대상 미니언 선택
  const minionId = await Terminal.select(i18n.t('skill.SOUL_TRANSFER.select_prompt'), [
    ...minions.map((m) => ({
      name: m.id,
      message: i18n.t('skill.choice_format', {
        name: m.name,
        hp: m.ref.hp,
        maxHp: m.ref.maxHp,
      }),
      value: m.id,
      disabled: !m.ref.isAlive
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  // 3. 취소 처리
  if (minionId === 'cancel') {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const targetMinion = minions.find((m) => m.id === minionId)
  if (!targetMinion) return { isSuccess: false, isAggressive: false, gross: 0 }

  // 4. 효과 적용 및 어픽스 판정
  let totalGross = 0
  let isSpecialEffectTriggered = false

  const hasEmpower = player.ref.hasAffix('EXALTATION')

  // [A] 강화 (EMPOWER_SOUL) - 착취와 중첩 가능
  if (hasEmpower) {
    const drainAmount = Math.floor(targetMinion.ref.hp * 0.2)
    targetMinion.ref.hp = Math.max(1, targetMinion.ref.hp - drainAmount)

    targetMinion.applyBuff({
      id: 'overdrive',
      type: 'dot',
      atk: 20,
      dot: 10,
      duration: 3 + 1, // 행동 시작 시 차감 고려
    })

    totalGross += 65
    isSpecialEffectTriggered = true
  }

  // [B] 기본 치유 - 특수 어픽스가 없을 때만 발동
  if (!isSpecialEffectTriggered) {
    // 1. 목표 회복량 설정 (미니언 최대 체력의 30%)
    const targetHealGoal = Math.ceil(targetMinion.ref.maxHp * 0.3)

    // 2. 미니언에게 실제로 필요한 회복량 (최대 체력을 넘길 순 없으므로)
    const actualNeed = targetMinion.ref.maxHp - targetMinion.ref.hp

    // 이미 체력이 가득 찬 경우 처리
    if (actualNeed <= 0) {
      Terminal.log(i18n.t('skill.SOUL_TRANSFER.already_full', { name: targetMinion.name }))
      return {
        isSuccess: true, // 기술 시전은 성공한 것으로 간주 (혹은 필요에 따라 false)
        isAggressive: false,
        gross: 0,
      }
    }

    // 3. 사령술사가 줄 수 있는 최대치 (자신의 체력 10%는 남겨야 함)
    const playerSafeLimit = Math.max(0, player.ref.hp - Math.floor(player.ref.maxHp * 0.1))

    // 4. 최종 양도량 결정
    // (목표량 10% vs 실제 필요량) 중 작은 값을 먼저 구하고,
    // 그 값이 플레이어가 줄 수 있는 한계를 넘지 않도록 조정
    const finalTransferAmount = Math.min(Math.min(targetHealGoal, actualNeed), playerSafeLimit)

    if (finalTransferAmount > 0) {
      // 플레이어 체력 감소
      player.ref.hp -= finalTransferAmount
      // 미니언 체력 증가
      targetMinion.ref.hp += finalTransferAmount

      Terminal.log(
        i18n.t('skill.SOUL_TRANSFER.success_log', {
          player: player.name,
          target: targetMinion.name,
          hp: targetMinion.ref.hp,
          maxHp: targetMinion.ref.maxHp,
        })
      )
      Terminal.log(
        i18n.t('skill.SOUL_TRANSFER.transfer_detail', {
          amount: finalTransferAmount,
          target: targetMinion.name,
        })
      )
    } else {
      Terminal.log(i18n.t('skill.SOUL_TRANSFER.low_health', { name: player.name }))

      return {
        isSuccess: false,
        isAggressive: false,
        gross: 0,
      }
    }

    totalGross = 5 // 자신의 살을 내어주는 숭고한(?) 행위이므로 낮게 설정
  }

  return {
    isSuccess: true,
    isAggressive: false,
    gross: totalGross,
  }
}
