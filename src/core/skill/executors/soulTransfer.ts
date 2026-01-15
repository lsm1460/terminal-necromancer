import enquirer from 'enquirer'
import { ExecuteSkill } from '../../../types'

/**
 * 영혼 전달 (Soul Transfer)
 * : 플레이어와 미니언 간의 영혼 에너지를 공명시킵니다.
 * : [기본] 미니언 치유
 * : [어픽스: EMPOWER_SOUL] 미니언 공격력 버프 부여 + 체력 감소
 */
export const soulTransfer: ExecuteSkill = async (player, context, { ally = [], enemies } = {}) => {
  const minions = ally.filter((target) => target.ref.isMinion)
  const affixes = player.ref.affixes || []

  // 1. 소환수 존재 여부 체크
  if (minions.length === 0) {
    console.log('\n[실패] 상호작용할 미니언이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 대상 미니언 선택 (Enquirer Select)
  const { minionId } = await enquirer.prompt<{ minionId: string }>({
    type: 'select',
    name: 'minionId',
    message: '어느 미니언과 영혼을 공명하시겠습니까?',
    choices: [
      ...minions.map((m) => ({
        name: m.id,
        message: `${m.name} (HP: ${m.ref.hp}/${m.ref.maxHp})`,
        value: m.id,
      })),
      { name: 'cancel', message: '🔙 취소하기', value: 'cancel' },
    ],
    result(name) {
      // name(message)이 아닌 실제 value(id)를 반환하도록 처리
      return (this as any).choices.find((c: any) => c.name === name).value
    },
    format(value) {
      if (value === 'cancel') return '시전 취소'
      const target = minions.find((m) => m.id === value)
      return target ? `[${target.name}]` : value
    },
  })

  // 3. 취소 처리
  if (minionId === 'cancel') {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const targetMinion = minions.find((m) => m.id === minionId)
  if (!targetMinion) return { isSuccess: false, isAggressive: false, gross: 0 }

  // 4. 효과 적용 및 어픽스 판정
  let totalGross = 0
  let isSpecialEffectTriggered = false

  const hasEmpower = affixes.includes('EXALTATION')

  // [A] 강화 (EMPOWER_SOUL) - 착취와 중첩 가능
  if (hasEmpower) {
    const drainAmount = Math.floor(targetMinion.ref.hp * 0.2)
    targetMinion.ref.hp = Math.max(1, targetMinion.ref.hp - drainAmount)

    targetMinion.applyBuff({
      name: '광폭화',
      type: 'buff',
      atk: 15,
      duration: 3 + 1, // 행동 시작 시 차감 고려
    })

    const prefix = isSpecialEffectTriggered ? ' └ ' : '\n'
    console.log(
      `${prefix}🔥 [강화] ${targetMinion.name}의 영혼을 강제로 폭주시켜 위력을 끌어올립니다! (${targetMinion.name} HP ${targetMinion.ref.hp} / ${targetMinion.ref.maxHp})`
    )
    totalGross += 65
    isSpecialEffectTriggered = true
  }

  // [B] 기본 치유 - 특수 어픽스가 없을 때만 발동
  if (!isSpecialEffectTriggered) {
    // 1. 목표 회복량 설정 (미니언 최대 체력의 10%)
    const targetHealGoal = Math.ceil(targetMinion.ref.maxHp * 0.1)

    // 2. 미니언에게 실제로 필요한 회복량 (최대 체력을 넘길 순 없으므로)
    const actualNeed = targetMinion.ref.maxHp - targetMinion.ref.hp

    // 이미 체력이 가득 찬 경우 처리
    if (actualNeed <= 0) {
      console.log(`\n🌿 ${targetMinion.name}의 영혼이 이미 충만하여 더 이상 생명력을 나눌 필요가 없습니다.`)
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

      console.log(
        `\n✨ [치유] ${player.name}의 영혼으로 ${targetMinion.name}의 상처를 메꿉니다. (${targetMinion.name} HP ${targetMinion.ref.hp} / ${targetMinion.ref.maxHp})`
      )
      console.log(` └ 🩸 사령술사 HP -${finalTransferAmount} ➡️ ${targetMinion.name} HP +${finalTransferAmount}`)
    } else {
      console.log(`\n⚠️ ${player.name}의 체력이 너무 낮아 더 이상 생명력을 나누어줄 수 없습니다!`)

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
