import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ExecuteSkill } from '~/types'

/**
 * 시체 폭발 (Corpse Explosion)
 * : 현재 위치의 시체 또는 스켈레톤을 소모하여 주변 적들에게 광역 피해를 입힙니다.
 * : 공격자의 스탯이 아닌 '시체의 최대 생명력'에 기반한 데미지를 전달합니다.
 */
export const corpseExplosion: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const { world } = context
  const { x, y } = player.ref.pos

  // 1. 가용 자원(시체 & 스켈레톤) 통합
  const corpses = world.getCorpsesAt(x, y)
  const skeletons = player.ref.skeleton

  const targets = [
    ...corpses.map((corpse) => ({
      id: corpse.id,
      name: corpse.name,
      type: 'corpse' as const,
      hp: 0,
      maxHp: corpse.maxHp,
    })),
    ...skeletons.map((sk) => ({ id: sk.id, name: sk.name, type: 'skeleton' as const, hp: sk.hp, maxHp: sk.maxHp })),
  ]

  if (targets.length === 0) {
    Terminal.log(i18n.t('skill.not_found'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 소모할 대상 선택
  const corpseId = await Terminal.select(i18n.t('skill.CORPSE_EXPLOSION.select_prompt'), [
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

  if (corpseId === 'cancel') {
    Terminal.log('\n💬 ' + i18n.t('skill.cancel_action'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const selectedCorpse = targets.find((target) => target.id === corpseId)
  if (!selectedCorpse) {
    Terminal.log(i18n.t('skill.not_found'))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 3. 데미지 계산 및 폭발 연출
  const rawExplosionDamage = Math.floor(selectedCorpse.maxHp * 0.6)
  Terminal.log(
    i18n.t('skill.CORPSE_EXPLOSION.activation', {
      player: player.name,
      damage: rawExplosionDamage,
    })
  )

  // 4. 주변 적들에게 데미지 적용
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

  // 5. 사용한 자원 제거
  if (selectedCorpse.type === 'corpse') {
    world.removeCorpse(selectedCorpse.id)
  } else {
    const skeleton = player.ref.skeleton.find((sk) => sk.id === selectedCorpse.id)
    if (skeleton) {
      skeleton.hp = 0
      skeleton.isAlive = false
    }
    player.ref.removeMinion(selectedCorpse.id)
  }

  return {
    isSuccess: true,
    isAggressive,
    gross: 70,
  }
}
