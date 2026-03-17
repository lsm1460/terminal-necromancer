import { TargetSelector } from '~/core/battle/TargetSelector'
import { Terminal } from '~/core/Terminal'
import { ExecuteSkill } from '~/types'

/**
 * 저주 (Curse)
 * - 일반: 공격력 5% 감소 (나머지 버림)
 * - 부식(CORROSION): 방어력 5% 감소 (나머지 버림) ※ 공격력 감소는 적용 안 함
 * - 광역(WIDE_CURSE): 모든 생존한 적에게 적용
 */
export const curse: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const duration = 3
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  const isCorrosion = player.ref.hasAffix('CORROSION')
  const isWide = player.ref.hasAffix('WIDE_CURSE')

  const curseName = isCorrosion ? '부식' : '저주'
  const displayName = isWide ? `광역 ${curseName}` : curseName

  if (aliveEnemies.length === 0) {
    Terminal.log(`\n[실패] ${displayName}의 대상이 없습니다.`)
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 실제 디버프 적용 함수
  const applyCurse = (target: any) => {
    // 부식일 때는 방어력만, 아닐 때는 공격력만 계산
    const atkReduction = !isCorrosion ? Math.max(Math.floor(target.stats.atk * 0.5), 1) : 0
    const defReduction = isCorrosion ? Math.max(Math.floor(target.stats.def * 0.5), 1) : 0

    target.applyDeBuff({
      id: isCorrosion ? 'corrosion' : 'curse',
      type: 'deBuff',
      ...(isCorrosion ? { def: defReduction } : { atk: atkReduction }),
      duration: duration + 1,
    })

    // 로그 출력 분기
    const effectDetail = isCorrosion ? `방어력 -${defReduction}` : `공격력 -${atkReduction}`

    Terminal.log(` └ [약화] ${target.name}: ${effectDetail} (${duration}턴)`)
  }

  try {
    // --- 1. 광역 효과 처리 ---
    if (isWide) {
      Terminal.log(`\n💀 ${player.name}의 ${displayName}가 전장에 퍼져나갑니다!`)
      aliveEnemies.forEach((enemy) => applyCurse(enemy))

      return { isSuccess: true, isAggressive: true, gross: 120 }
    }

    // --- 2. 단일 타겟 선택 ---
    const { choices } = new TargetSelector(aliveEnemies)
      .excludeStealth()
      .labelIf((e) => e.deBuff.some((d) => d.name === curseName), ` (이미 ${curseName} 상태)`)
      .build()

    const targetId = await Terminal.select(`${displayName}의 대상을 선택하세요`, [
      ...choices,
      { name: 'cancel', message: '↩ 뒤로 가기' },
    ])

    if (targetId === 'cancel') return { isSuccess: false, isAggressive: false, gross: 0 }

    const target = aliveEnemies.find((e) => e.id === targetId)
    if (!target) return { isSuccess: false, isAggressive: false, gross: 0 }

    Terminal.log(`\n💀 ${player.name}이(가) ${target.name}에게 ${curseName}를 내립니다!`)
    applyCurse(target)

    return {
      isSuccess: true,
      isAggressive: true,
      gross: 90,
    }
  } catch (error) {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }
}
