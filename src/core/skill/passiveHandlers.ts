import { NpcSkill } from '../../types'
import { Battle, DamageOptions } from '../battle/Battle'
import { CombatUnit } from '../battle/CombatUnit'

type PassiveEffect = (
  attacker: CombatUnit,
  defender: CombatUnit,
  skill: NpcSkill,
  battle: Battle,
  options?: DamageOptions
) => Promise<void>

interface PassiveDefinition {
  onBeforeAttack?: PassiveEffect
  onAfterAttack?: PassiveEffect
  onAfterHit?: PassiveEffect
  onDeath?: (attacker: CombatUnit, skill: NpcSkill, battle: Battle, options?: DamageOptions) => Promise<void>
}

export const PASSIVE_EFFECTS: Record<string, PassiveDefinition> = {
  death_aura: {
    onBeforeAttack: async (attacker, defender, skill, battle) => {
      console.log(`\x1b[31m[!] ${attacker.name}의 죽음의 오라가 적들의 영혼을 옥죄기 시작합니다...\x1b[0m`)

      const enemies = battle.getEnemiesOf(attacker)

      for (const enemy of enemies) {
        // 1. 버프/디버프 적용
        if (skill.buff) {
          enemy.applyDeBuff({ ...skill.buff })
        }

        // 2. 오라 데미지 계산 (추천: 공격력의 25% 정도의 서늘한 고정 피해)
        // 너무 세면 밸런스가 파괴되므로 '도트 데미지' 느낌으로 설정합니다.
        const auraDamage = Math.floor(attacker.stats.atk * 0.25)

        if (auraDamage > 0) {
          await enemy.executeHit(attacker, {
            rawDamage: auraDamage,
            isPassive: true,
          })
        }
      }
    },
  },

  thorns: {
    onAfterHit: async (attacker, defender, skill, battle, options) => {
      if (options?.attackType !== 'melee') {
        return
      }

      const thornDamage = Math.max(1, Math.floor(defender.stats.atk * 0.05))

      console.log(`\n[🦷 가시]: ${defender.name}의 가시가 ${attacker.name}의 살점을 찢습니다!`)

      // attacker가 이미 죽었는지 확인
      if (!attacker.ref.isAlive) return

      await attacker.executeHit(defender, {
        rawDamage: thornDamage,
        isPassive: true, // 무한 루프 방지
        isIgnoreDef: false,
        isSureHit: false,
      })
    },
  },

  // 2. 종말 (DOOMSDAY -> death_destruct) - 스켈레톤 전용 자폭
  death_destruct: {
    onDeath: async (unit, skill, battle) => {
      // 스켈레톤 타입인지 확인
      const enemies = battle.getEnemiesOf(unit)
      const explosionDamage = Math.floor(unit.ref.maxHp * 0.6)

      console.log(`\n[🔥 종말]: ${unit.name}의 시체가 폭발하며 주변을 삼킵니다!`)

      for (const enemy of enemies) {
        if (!enemy.ref.isAlive) continue

        await enemy.executeHit(unit, {
          rawDamage: explosionDamage,
          isPassive: true,
          isIgnoreDef: false,
          isSureHit: false,
        })
      }
    },
  },

  // 3. 서리 서린 유해 (FROSTBORNE) - 스켈레톤 전용 타격 시 디버프
  frostborne: {
    onAfterAttack: async (attacker, defender, skill, battle) => {
      defender.applyDeBuff(skill.buff!)
    },
  },
}
