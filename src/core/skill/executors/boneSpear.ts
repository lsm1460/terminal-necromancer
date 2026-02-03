import enquirer from 'enquirer'
import { ExecuteSkill } from '../../../types'

/**
 * 뼈 창 (Bone Spear)
 * : 소환된 스켈레톤 하나를 희생시켜 날카로운 뼈의 창으로 부수어 날립니다.
 * : 전열의 적 최대 2명에게 0.6배율의 관통 피해를 입힙니다.
 */
export const boneSpear: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const skeletons = player.ref.skeleton // 현재 소환된 스켈레톤 목록
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  // 1. 발사체(스켈레톤) 확인
  if (skeletons.length === 0) {
    console.log('\n[실패] 희생시킬 스켈레톤이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 적 확인
  if (aliveEnemies.length === 0) {
    console.log('\n[실패] 관통할 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 3. 희생시킬 스켈레톤 선택
  const { skeletonId } = await enquirer.prompt<{ skeletonId: string }>({
    type: 'select',
    name: 'skeletonId',
    message: '어느 스켈레톤을 뼈 창으로 만드시겠습니까?',
    choices: [
      ...skeletons.map((sk) => ({
        name: sk.id,
        message: `${sk.name} (현재 HP: ${sk.hp})`,
      })),
      { name: 'cancel', message: '🔙 취소하기', value: 'cancel' },
    ],
    format(value) {
      if (value === 'cancel') return '취소됨'

      const target = skeletons.find((c, idx) => (c.id || idx.toString()) === value)
      return target ? `[${target.name}]` : value
    },
  })

  if (skeletonId === 'cancel') {
    console.log('\n💬 스킬 사용을 취소했습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 4. 스켈레톤 희생 처리
  const targetSkeleton = player.ref.skeleton.find((sk) => sk.id === skeletonId)
  if (targetSkeleton) {
    console.log(`\n💀 ${player.name}이(가) ${targetSkeleton.name}을(를) 파괴하여 거대한 뼈 창을 빚어냅니다!`)
    targetSkeleton.hp = 0
    targetSkeleton.isAlive = false
    player.ref.removeMinion(skeletonId) // 미니언 목록에서 제거
  } else {
    console.log('\n[실패] 희생시킬 스켈레톤이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 5. 타겟팅 및 공격
  const hasSurprise = player.ref.hasAffix('SURPRISE_ATTACK')
  const targets = hasSurprise ? aliveEnemies.slice(-2).reverse() : aliveEnemies.slice(0, 2)

  const logTemplate = hasSurprise
    ? {
        primary: (name: string) => ` └ 🧤 기습! 뼈 창이 그림자 속에서 가장 뒤의 ${name}의 등을 꿰뚫습니다!`,
        secondary: (name: string) => ` └ ⚡ 연쇄 기습! 당황한 ${name}까지 창날에 휘말립니다!`,
      }
    : {
        primary: (name: string) => ` └ 🚀 뼈 창이 전열의 ${name}에게 정면으로 격돌합니다!`,
        secondary: (name: string) => ` └ ⚡ 창이 뒤에 있던 ${name}까지 깊숙이 관통합니다!`,
      }

  // 3. 실행 및 로그 출력
  for (let index in targets) {
    const target = targets[index]
    const logMsg = index == '0' ? logTemplate.primary(target.name) : logTemplate.secondary(target.name)
    console.log(logMsg)

    /**
     * skillAtkMult: 0.6 배율 적용
     */
    await target.executeHit(player, {
      skillAtkMult: 0.6,
      isIgnoreDef: false,
      isSureHit: false,
      attackType: 'ranged'
    })

    target.applyDeBuff({
      name: '출혈',
      type: 'dot', // Damage over Time
      duration: 3 + 1, // 3턴 지속
      atk: 5,
    })
  }

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 80,
  }
}
