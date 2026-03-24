import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import SkeletonWrapper from '~/core/player/SkeletonWrapper'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'
import { failWithLog, sacrificeSkeleton } from './lib'

/**
 * 뼈 창 (Bone Spear)
 * : 소환된 스켈레톤 하나를 희생시켜 날카로운 뼈의 창으로 부수어 날립니다.
 * : 전열의 적 최대 2명에게 시체의 최대 체력의 0.4배율의 관통 피해를 입힙니다.
 */
export const boneSpear: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const skeletons = player.ref.skeleton
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  if (skeletons.length === 0) return failWithLog('skill.BONE_SPEAR.no_skeletons')
  if (aliveEnemies.length === 0) return failWithLog('skill.BONE_SPEAR.no_enemies')

  const selectedId = await selectSkeletonToSacrifice(player.ref.skeleton)
  if (selectedId === 'cancel') {
    Terminal.log(i18n.t('skill.BONE_SPEAR.cancel_msg'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2-2. 실제 희생 처리 (로직 수행)
  const targetSkeleton = sacrificeSkeleton(player, selectedId)
  if (!targetSkeleton) return failWithLog('skill.BONE_SPEAR.no_skeletons')

  Terminal.log(i18n.t('skill.BONE_SPEAR.activation', { player: player.name, target: targetSkeleton.name }))

  const targets = determineBoneSpearTargets(player, aliveEnemies)

  await executeBoneSpearAttack(player, targets, targetSkeleton)

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 80,
  }
}

async function selectSkeletonToSacrifice(skeletons: SkeletonWrapper[]): Promise<string | 'cancel'> {
  return await Terminal.select(i18n.t('skill.BONE_SPEAR.select_prompt'), [
    ...skeletons.map((sk) => ({
      name: sk.id,
      message: i18n.t('skill.choice_format', { name: sk.name, hp: sk.hp, maxHp: sk.maxHp }),
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])
}

function determineBoneSpearTargets(player: CombatUnit<Player>, aliveEnemies: CombatUnit[]) {
  const hasSurprise = player.ref.hasAffix('SURPRISE_ATTACK')
  return hasSurprise ? aliveEnemies.slice(-2).reverse() : aliveEnemies.slice(0, 2)
}

async function executeBoneSpearAttack(player: CombatUnit<Player>, targets: CombatUnit[], source: SkeletonWrapper) {
  const isResurrection = player.ref.hasAffix('RESURRECTION')
  const hasSurprise = player.ref.hasAffix('SURPRISE_ATTACK')
  const typeKey = hasSurprise ? 'surprise' : 'normal'

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]
    const roleKey = i === 0 ? 'primary' : 'secondary'

    Terminal.log(i18n.t(`skill.BONE_SPEAR.log.${typeKey}_${roleKey}`, { name: target.name }))

    // 대미지 계산 및 히트 실행 (체력의 40% 물리 대미지)
    await target.executeHit(player, {
      rawDamage: Math.floor(source.maxHp * 0.4),
      isIgnoreDef: true,
      isSureHit: true,
      attackType: 'ranged',
    })

    // 출혈 디버프 부여
    target.applyDeBuff({
      id: 'bleed',
      type: 'dot',
      duration: 4, // 3턴 지속 (구현 방식에 따라 3+1 또는 4)
      atk: 5,
    })
  }

  if (isResurrection) {
    Terminal.log(i18n.t('skill.BONE_SPEAR.resurrection_active', { target: source.name }))
  }
}
