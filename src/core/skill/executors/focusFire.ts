import enquirer from 'enquirer'
import { ExecuteSkill } from '../../../types'

/**
 * 표식 (Curse)
 * - 일반: 미니언들의 공격 대상을 지정합니다.
 */
export const focusFire: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const duration = 3
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  const curseName = '[죽음의 표식]'

  if (aliveEnemies.length === 0) {
    console.log(`\n[실패] 대상이 없습니다.`)
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  try {
    // --- 2. 단일 타겟 선택 ---
    const choices = [
      ...aliveEnemies.map((e) => ({
        name: e.id,
        message:
          `${e.name} hp: ${e.ref.hp}/${e.ref.maxHp} ` +
          (e.deBuff.some((d) => d.name === curseName) ? ` (이미 ${curseName} 상태)` : ''),
        value: e.id,
      })),
      { name: 'cancel', message: '↩ 뒤로 가기', value: 'cancel' },
    ]

    const response = await enquirer.prompt<{ targetId: string }>({
      type: 'select',
      name: 'targetId',
      message: `대상을 선택하세요`,
      choices: choices,
    })

    if (response.targetId === 'cancel') return { isSuccess: false, isAggressive: false, gross: 0 }

    const target = aliveEnemies.find((e) => e.id === response.targetId)
    if (!target) return { isSuccess: false, isAggressive: false, gross: 0 }

    console.log(`\n[!] ${player.name}이(가) ${target.name}에게 서늘한 죽음의 손짓을 보냅니다!`)
    console.log(`[!] 모든 수하의 안광이 붉게 타오릅니다.\n`)

    target.applyDeBuff({
      name: curseName,
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
