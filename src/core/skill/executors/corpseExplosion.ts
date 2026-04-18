import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { BattleTarget, ExecuteSkill } from '~/types'

interface ExplosionTarget {
  id: string
  name: string
  type: 'corpse' | 'skeleton'
  hp: number
  maxHp: number
}

/**
 * 시체 폭발 (Corpse Explosion)
 * : 현재 위치의 시체 또는 스켈레톤을 소모하여 주변 적들에게 광역 피해를 입힙니다.
 * : 공격자의 스탯이 아닌 '시체의 최대 생명력'에 기반한 데미지를 전달합니다.
 */
export const corpseExplosion: ExecuteSkill = async (player, { world }, { enemies = [] } = {}) => {
  const isChaining = player.ref.hasAffix('CHAIN_EXPLOSION')
  const targets = collectExplosionTargets(player.ref, world, isChaining)

  if (targets.length === 0) {
    Terminal.log(i18n.t('skill.not_found'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  let isAggressive = false
  let totalGross = 0

  if (isChaining) {
    // 모든 시체/스켈레톤 연쇄 폭발
    for (const target of targets) {
      const result = await executeSingleExplosion(player, world, target, enemies)
      if (result.isAggressive) isAggressive = true
      totalGross += 70
    }
  } else {
    // 단일 대상 선택 폭발
    const selectedId = await selectTarget(targets)
    if (selectedId === 'cancel') {
      Terminal.log('\n💬 ' + i18n.t('skill.cancel_action'))
      return { isSuccess: false, isAggressive: false, gross: 0 }
    }

    const target = targets.find((t) => t.id === selectedId)
    if (target) {
      const result = await executeSingleExplosion(player, world, target, enemies)
      isAggressive = result.isAggressive
      totalGross = 70
    }
  }

  return {
    isSuccess: true,
    isAggressive,
    gross: totalGross,
  }
}

/**
 * 폭발 가능한 자원(시체 & 스켈레톤) 수집
 * : isChaining이 true라면 시체(corpses)만 수집합니다.
 */
function collectExplosionTargets(player: Player, world: World, isChaining: boolean): ExplosionTarget[] {
  const corpses = world.getCorpsesAt(player.pos)

  const targets: ExplosionTarget[] = corpses.map((corpse) => ({
    id: corpse.id,
    name: corpse.name,
    type: 'corpse' as const,
    hp: 0,
    maxHp: corpse.maxHp,
  }))

  if (!isChaining) {
    const skeletons = player.skeleton
    targets.push(
      ...skeletons.map((sk: BattleTarget) => ({
        id: sk.id,
        name: sk.name,
        type: 'skeleton' as const,
        hp: sk.hp,
        maxHp: sk.maxHp,
      }))
    )
  }

  return targets
}

/**
 * 폭발 대상 선택 UI
 */
async function selectTarget(targets: ExplosionTarget[]): Promise<string> {
  return await Terminal.select(i18n.t('skill.CORPSE_EXPLOSION.select_prompt'), [
    ...targets.map((s) => ({
      name: s.id,
      message: i18n.t('skill.choice_format', {
        name: s.name,
        hp: s.hp,
        maxHp: s.maxHp,
      }),
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])
}

/**
 * 단일 대상 폭발 실행
 */
async function executeSingleExplosion(
  player: CombatUnit<Player>,
  world: World,
  target: ExplosionTarget,
  enemies: CombatUnit[]
): Promise<{ isAggressive: boolean }> {
  const rawExplosionDamage = Math.floor(target.maxHp * 0.5)

  Terminal.log(
    i18n.t('skill.CORPSE_EXPLOSION.activation', {
      player: player.name,
      damage: rawExplosionDamage,
    })
  )

  let isAggressive = true
  if (enemies.length === 0) {
    Terminal.log(i18n.t('skill.CORPSE_EXPLOSION.no_enemies'))
    isAggressive = false
  } else {
    for (const enemy of enemies) {
      if (enemy.ref.hp === 0) continue

      await enemy.executeHit(player, {
        rawDamage: rawExplosionDamage,
        isIgnoreDef: false,
        isSureHit: false,
        attackType: 'explode',
      })
    }
  }

  // 자원 소모 처리
  if (target.type === 'corpse') {
    world.removeCorpse(target.id)
  } else {
    const skeleton = player.ref.skeleton.find((sk) => sk.id === target.id)
    if (skeleton) {
      skeleton.hp = 0
      skeleton.isAlive = false
    }
    player.ref.removeMinion(target.id)
  }

  return { isAggressive }
}
