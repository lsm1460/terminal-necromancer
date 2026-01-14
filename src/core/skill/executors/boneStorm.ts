import { ExecuteSkill } from '../../../types'

/**
 * 뼈 폭풍 (Bone Storm)
 * : 모든 스켈레톤을 희생시켜 적 전체에게 치명적인 광역 피해와 [출혈]을 부여합니다.
 * : 희생된 모든 스켈레톤 현재 HP 합계의 80%를 적의 수로 나누어 데미지를 입힙니다.
 */
export const boneStorm: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const skeletons = player.ref.skeleton
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  // 1. 발사체(스켈레톤) 확인
  if (skeletons.length === 0) {
    console.log('\n[실패] 희생시킬 스켈레톤이 하나도 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  if (aliveEnemies.length === 0) {
    console.log('\n[실패] 공격할 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 데미지 계산 (희생될 모든 스켈레톤의 현재 HP 합산)
  const totalSkeletonHp = skeletons.reduce((sum, sk) => sum + sk.hp, 0)
  const totalRawDamage = Math.floor(totalSkeletonHp * 0.3);
  const sacrificeCount = skeletons.length

  console.log(`\n🌪️  ${player.name}이 모든 스켈레톤을 파괴하여 뼈의 폭풍을 일으킵니다!`)
  console.log(
    ` └ 🔥 총 ${sacrificeCount}구의 스켈레톤이 산산조각나며 파편이 휘몰아칩니다.`
  )

  // 3. 모든 스켈레톤 희생 처리
  // 배열을 순회하며 모두 파괴
  ;[...skeletons].forEach((sk) => {
    sk.hp = 0
    sk.isAlive = false
    player.ref.removeMinion(sk.id)
  })

  // 4. 모든 적에게 데미지 및 [출혈] 부여
  aliveEnemies.forEach((enemy) => {
    console.log(` └ 🩸 날카로운 뼈 파편이 ${enemy.name}을 찢어발깁니다!`)

    // 데미지 적용 (고정 데미지가 아니므로 적 방어력에 감쇄됨)
    enemy.takeDamage(player, context, {
      rawDamage: totalRawDamage,
      isIgnoreDef: false,
    })

    // [출혈] 디버프 추가 (지속 피해)
    enemy.deBuff.push({
      name: '출혈',
      type: 'dot', // Damage over Time
      duration: 3 + 1, // 3턴 지속
      atk: sacrificeCount * 5, // 시전자 공격력 비례 지속 피해 예시
    })
  })

  return {
    isSuccess: true,
    isAggressive: true,
    /**
     * gross (역겨움 수치): 95
     * 소환수 전체를 한꺼번에 부수고 피칠갑을 만드는 기술이므로
     * 시체 폭발을 뛰어넘는 최고의 불쾌감을 줍니다.
     */
    gross: 95,
  }
}
