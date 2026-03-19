import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'

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
    Terminal.log(i18n.t('skill.BONE_SPEAR.no_skeletons'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 적 확인
  if (aliveEnemies.length === 0) {
    Terminal.log(i18n.t('skill.BONE_SPEAR.no_enemies'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 3. 희생시킬 스켈레톤 선택
  const skeletonId = await Terminal.select(i18n.t('skill.BONE_SPEAR.select_prompt'), [
    ...skeletons.map((sk) => ({
      name: sk.id,
      message: i18n.t('skill.choice_format', { name: sk.name, hp: sk.hp, maxHp: sk.maxHp }),
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  if (skeletonId === 'cancel') {
    Terminal.log(i18n.t('skill.BONE_SPEAR.cancel_msg'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 4. 스켈레톤 희생 처리
  const targetSkeleton = player.ref.skeleton.find((sk) => sk.id === skeletonId)
  if (targetSkeleton) {
    Terminal.log(i18n.t('skill.BONE_SPEAR.activation', { player: player.name, target: targetSkeleton.name }))
    targetSkeleton.hp = 0
    targetSkeleton.isAlive = false
    player.ref.removeMinion(skeletonId) // 미니언 목록에서 제거
  } else {
    Terminal.log(i18n.t('skill.BONE_SPEAR.no_skeletons'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 5. 타겟팅 및 공격
  const hasSurprise = player.ref.hasAffix('SURPRISE_ATTACK')
  const targets = hasSurprise ? aliveEnemies.slice(-2).reverse() : aliveEnemies.slice(0, 2)

  const logTemplate = hasSurprise
    ? {
        primary: (name: string) => i18n.t('skill.BONE_SPEAR.log.surprise_primary', { name }),
        secondary: (name: string) => i18n.t('skill.BONE_SPEAR.log.surprise_secondary', { name }),
      }
    : {
        primary: (name: string) => i18n.t('skill.BONE_SPEAR.log.normal_primary', { name }),
        secondary: (name: string) => i18n.t('skill.BONE_SPEAR.log.normal_secondary', { name }),
      }

  // 3. 실행 및 로그 출력
  for (let index in targets) {
    const target = targets[index]
    const logMsg = index == '0' ? logTemplate.primary(target.name) : logTemplate.secondary(target.name)
    Terminal.log(logMsg)

    /**
     * skillAtkMult: 0.6 배율 적용
     */
    await target.executeHit(player, {
      skillAtkMult: 0.6,
      isIgnoreDef: false,
      isSureHit: false,
      attackType: 'ranged',
    })

    target.applyDeBuff({
      id: 'bleed',
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
