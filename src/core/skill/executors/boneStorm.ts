import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'
import { failWithLog, sacrificeSkeleton } from './lib'

/**
 * 뼈 폭풍 (Bone Storm)
 * : 모든 스켈레톤을 희생시켜 적 전체에게 치명적인 광역 피해와 [출혈]을 부여합니다.
 * : 희생된 모든 스켈레톤 현재 HP 합계의 30%를 데미지로 입힙니다.
 */
export const boneStorm: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const skeletons = player.ref.skeleton
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  // 1. 유효성 검사
  if (skeletons.length === 0) return failWithLog('skill.BONE_STORM.no_skeletons')
  if (aliveEnemies.length === 0) return failWithLog('skill.BONE_STORM.no_enemies')

  // 2. 희생 데이터 계산 (데미지 및 개수)
  const sacrificeCount = skeletons.length
  const totalRawDamage = calculateTotalBoneStormDamage(skeletons)

  Terminal.log(i18n.t('skill.BONE_STORM.activation', { player: player.name }))
  Terminal.log(i18n.t('skill.BONE_STORM.sacrifice_detail', { count: sacrificeCount }))

  // 3. 모든 스켈레톤 희생 처리 (배열 복사본 사용 권장)
  const targetIds = skeletons.map((sk) => sk.id)
  targetIds.forEach((id) => sacrificeSkeleton(player, id))

  // 4. 모든 적에게 광역 공격 집행
  await executeBoneStormAttack(player, aliveEnemies, totalRawDamage, sacrificeCount)

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 95,
  }
}

function calculateTotalBoneStormDamage(skeletons: any[]): number {
  const totalHp = skeletons.reduce((sum, sk) => sum + sk.hp, 0)
  return Math.floor(totalHp * 0.3)
}

async function executeBoneStormAttack(
  player: CombatUnit<Player>,
  enemies: any[],
  damage: number,
  sacrificeCount: number
) {
  for (const enemy of enemies) {
    Terminal.log(i18n.t('skill.BONE_STORM.hit_log', { name: enemy.name }))

    // 데미지 적용
    await enemy.executeHit(player, {
      rawDamage: damage,
      isIgnoreDef: false,
      attackType: 'ranged',
    })

    // 희생된 수만큼 중첩되는 출혈 부여
    enemy.applyDeBuff({
      id: 'bleed',
      type: 'dot',
      duration: 4,
      dot: sacrificeCount * 5,
    })
  }
}
