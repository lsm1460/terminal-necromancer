import { Terminal } from '~/core/Terminal'
import { ExecuteSkill } from '~/types'

/**
 * 시체 폭발 (Corpse Explosion)
 * : 현재 위치의 시체 또는 스켈레톤을 소모하여 주변 적들에게 광역 피해를 입힙니다.
 * : 공격자의 스탯이 아닌 '시체의 최대 생명력'에 기반한 데미지를 전달합니다.
 */
export const corpseExplosion: ExecuteSkill = async (player, context, { enemies = [] } = {}) => {
  const { world } = context
  const { x, y } = player.ref.pos

  // 1. 현재 위치의 시체 목록 확인
  const corpses = world.getCorpsesAt(x, y)
  const skeletons = player.ref.skeleton

  const targets = [
    ...corpses.map((corpse) => ({ id: corpse.id, name: corpse.name, type: 'corpse' as const, maxHp: corpse.maxHp })),
    ...skeletons.map((sk) => ({ id: sk.id, name: sk.name, type: 'skeleton' as const, maxHp: sk.maxHp })),
  ]

  const corpseId = await Terminal.select('어떤 시체를 소모하시겠습니까?', [
    ...targets.map((s) => ({
      name: s.id,
      message: s.name,
    })),
    { name: 'cancel', message: '🔙 취소하기' },
  ])

  if (corpseId === 'cancel') {
    Terminal.log('\n💬 스킬 사용을 취소했습니다.')
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  const selectedCorpse = targets.find((target) => target.id === corpseId)

  if (!selectedCorpse) {
    Terminal.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  // 2. 기초 데미지(rawDamage) 계산
  // 시체 maxHp의 60%를 폭발의 순수 위력으로 설정합니다.
  const rawExplosionDamage = Math.floor(selectedCorpse.maxHp * 0.6)

  Terminal.log(`\n💥 ${player.name}이(가) 시체를 터뜨렸습니다! (기초 위력: ${rawExplosionDamage})`)

  // 3. 주변 적들에게 데미지 적용
  // player를 공격자(attacker)로 넘기되, 계산 방식은 rawDamage 기반으로 수행하도록 전달합니다.

  let isAggressive = true

  if (enemies.length === 0) {
    Terminal.log(' 주변에 휘말린 적이 없습니다.')
    isAggressive = false
  } else {
    for (const enemy of enemies) {
      if (enemy.ref.hp === 0) continue

      await enemy.executeHit(player, {
        rawDamage: rawExplosionDamage,
        isIgnoreDef: false, // 시체 폭발이 방어력을 무시하게 하려면 true로 변경
        isSureHit: false, // 회피 불가능하게 하려면 true로 변경
        attackType: 'explode',
      })
    }
  }

  // 4. 사용한 시체 제거
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
