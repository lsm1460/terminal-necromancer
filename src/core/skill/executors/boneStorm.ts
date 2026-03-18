import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'

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
    Terminal.log(i18n.t('skill.BONE_STORM.no_skeletons'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  if (aliveEnemies.length === 0) {
    Terminal.log(i18n.t('skill.BONE_STORM.no_enemies'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 데미지 계산 (희생될 모든 스켈레톤의 현재 HP 합산)
  const totalSkeletonHp = skeletons.reduce((sum, sk) => sum + sk.hp, 0)
  const totalRawDamage = Math.floor(totalSkeletonHp * 0.3)
  const sacrificeCount = skeletons.length

  Terminal.log(i18n.t('skill.BONE_STORM.activation', { player: player.name }))
  Terminal.log(i18n.t('skill.BONE_STORM.sacrifice_detail', { count: sacrificeCount }))

  // 3. 모든 스켈레톤 희생 처리
  skeletons.forEach((sk) => {
    sk.hp = 0
    sk.isAlive = false
    player.ref.removeMinion(sk.id)
  })

  // 4. 모든 적에게 데미지 및 [출혈] 부여
  for (const enemy of aliveEnemies) {
    Terminal.log(i18n.t('skill.BONE_STORM.hit_log', { name: enemy.name }))

    // 데미지 적용 (고정 데미지가 아니므로 적 방어력에 감쇄됨)
    await enemy.executeHit(player, {
      rawDamage: totalRawDamage,
      isIgnoreDef: false,
      attackType: 'ranged'
    })

    enemy.applyDeBuff({
      id: 'bleed',
      type: 'dot',
      duration: 3 + 1,
      atk: sacrificeCount * 5,
    })
  }

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 95,
  }
}
