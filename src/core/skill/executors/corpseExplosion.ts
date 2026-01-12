import { GameContext, SkillResult } from '../../../types'
import { Battle, CombatUnit } from '../../Battle'
import { Player } from '../../Player'

/**
 * 시체 폭발 (Corpse Explosion)
 * : 현재 위치의 시체를 소모하여 주변 적들에게 광역 피해를 입힙니다.
 * : 공격자의 스탯이 아닌 '시체의 최대 생명력'에 기반한 데미지를 전달합니다.
 */
export const corpseExplosion = (
  player: CombatUnit<Player>,
  context: GameContext,
  targetId: string,
  enemies: CombatUnit[] = []
): SkillResult => {
  const { world } = context
  const { x, y } = player.ref.pos

  // 1. 현재 위치의 시체 목록 확인
  const corpses = world.getCorpsesAt(x, y)
  const selectedCorpse = corpses.find((c) => c.id === targetId)

  if (!selectedCorpse) {
    console.log('\n[실패] 폭발시킬 시체가 근처에 없습니다.')
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  // 2. 기초 데미지(rawDamage) 계산
  // 시체 maxHp의 20%를 폭발의 순수 위력으로 설정합니다.
  const rawExplosionDamage = Math.floor(selectedCorpse.maxHp * 0.2)

  console.log(`\n💥 ${player.name}이(가) 시체를 터뜨렸습니다! (기초 위력: ${rawExplosionDamage})`)

  // 3. 주변 적들에게 데미지 적용
  // player를 공격자(attacker)로 넘기되, 계산 방식은 rawDamage 기반으로 수행하도록 전달합니다.
  if (enemies.length === 0) {
    console.log(' 주변에 휘말린 적이 없습니다.')
  } else {
    enemies.forEach((enemy) => {
      // 적군이 살아있는지 확인 (이미 죽은 적은 제외)
      if (enemy.ref.hp > 0) {
        /**
         * 핵심: takeDamage 내부에서 calcDamage를 호출함
         * - rawDamage를 넘겼으므로 calcDamage는 공격자의 ATK 대신 이 값을 기초값으로 사용함
         * - 적의 DEF(방어력)에 의해 감쇄되며, 회피(EVA) 판정도 일어남
         */
        enemy.takeDamage(player, {
          rawDamage: rawExplosionDamage,
          isIgnoreDef: false, // 시체 폭발이 방어력을 무시하게 하려면 true로 변경
          isSureHit: false, // 회피 불가능하게 하려면 true로 변경
        })
      }
    })
  }

  // 4. 사용한 시체 제거
  world.removeCorpse(selectedCorpse.id)

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 70,
  }
}
