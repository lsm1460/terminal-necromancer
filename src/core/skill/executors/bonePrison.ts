import { TargetSelector } from '~/core/battle/TargetSelector'
import { Terminal } from '~/core/Terminal'
import { ExecuteSkill } from '~/types'

/**
 * 뼈 감옥 (Bone Prison)
 * : 대지에서 솟아오르는 뼈의 창살로 적 1명을 가둡니다.
 * : 대상에게 '뼈 감옥' [속박] 상태를 3턴 동안 부여합니다.
 */
export const bonePrison: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  if (aliveEnemies.length === 0) {
    Terminal.log('\n[실패] 감옥을 생성할 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 1. 대상 선택
  const { choices } = new TargetSelector(aliveEnemies)
    .excludeStealth()
    .excludeIf((u) => u.deBuff.some((d) => d.name === '뼈 감옥'), '(이미 갇힘)')
    .build()

  const targetId = await Terminal.select('뼈 감옥으로 가둘 대상을 선택하세요', [
    ...choices,
    { name: 'cancel', message: '🔙 취소하기' },
  ])

  if (targetId === 'cancel') {
    Terminal.log('\n💬 스킬 사용을 취소했습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const target = aliveEnemies.find((e) => e.id === targetId)
  if (!target) {
    Terminal.log('\n[실패] 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 디버프 부여
  const duration = 3

  target.applyDeBuff({
    id: 'bone_prison',
    type: 'bind',
    duration: duration + 1,
  })

  Terminal.log(` └ [속박] ${target.name}이(가) ${duration}턴 동안 속박되었습니다.`)

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 40,
  }
}
