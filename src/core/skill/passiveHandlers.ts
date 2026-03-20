import i18n from '~/i18n'
import { BattleTarget, NpcSkill, PhasesShift } from '~/types'
import { Battle, DamageOptions } from '../battle/Battle'
import { CombatUnit } from '../battle/unit/CombatUnit'
import { Terminal } from '../Terminal'
import { getOriginId } from '~/utils'

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

const RED = (text: string) => `\x1b[31m${text}\x1b[0m`

export const PASSIVE_EFFECTS: Record<string, PassiveDefinition> = {
  death_aura: {
    onBeforeAttack: async (attacker, defender, skill, battle) => {
      // 1. JSON에서 텍스트를 가져온 뒤 코드에서 빨간색을 입힙니다.
      const msg = i18n.t('skill.passive.death_aura', { attacker: attacker.name })
      Terminal.log(RED(msg))

      const enemies = battle.getEnemiesOf(attacker)
      for (const enemy of enemies) {
        if (skill.buff) enemy.applyDeBuff({ ...skill.buff })

        const auraDamage = Math.floor(attacker.stats.atk * 0.25)
        if (auraDamage > 0) {
          await enemy.executeHit(attacker, {
            rawDamage: auraDamage,
            isPassive: true,
            isSureHit: true,
            isFixed: true,
          })
        }
      }
    },
  },

  thorns: {
    onAfterHit: async (attacker, defender, skill, battle, options) => {
      if (options?.attackType !== 'melee') return

      const thornDamage = Math.max(1, Math.floor(defender.stats.atk * 0.05))

      // 가시는 일반 로그로 출력
      Terminal.log(
        i18n.t('skill.passive.thorns', {
          defender: defender.name,
          attacker: attacker.name,
        })
      )

      if (!attacker.ref.isAlive) return

      await attacker.executeHit(defender, {
        rawDamage: thornDamage,
        isPassive: true,
        isIgnoreDef: false,
        isSureHit: false,
      })
    },
  },

  death_destruct: {
    onDeath: async (unit, skill, battle) => {
      const enemies = battle.getEnemiesOf(unit)
      const explosionDamage = Math.floor(unit.ref.maxHp * 0.6)

      Terminal.log(i18n.t('skill.passive.death_destruct', { unit: unit.name }))

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

  frostborne: {
    onAfterAttack: async (attacker, defender, skill, battle) => {
      if (skill.buff) {
        defender.applyDeBuff(skill.buff)
      }
    },
  },

  second_phases: {
    onBeforeAttack: async (attacker, defender, skill, battle) => {
      handlePhases(attacker, skill as PhasesShift)
    },
  },

  third_phases: {
    onBeforeAttack: async (attacker, defender, skill, battle) => {
      handlePhases(attacker, skill as PhasesShift)
    },
  },
}

function handlePhases(attacker: CombatUnit, phases: PhasesShift) {
  const isActive = attacker.ref.hp / attacker.ref.maxHp < phases.chance

  if (!isActive && attacker.phases <= phases.step) return
  console.log('DEBUG::', attacker.phases, phases)
  const msg = i18n.t(`skill.passive.phases_${phases.step}`, { attacker: attacker.name })
  Terminal.log(RED(msg))

  attacker.ref.hp = attacker.ref.maxHp

  attacker.phases = phases.step

  const ref = attacker.ref as BattleTarget
  const originSkills = (ref.skills || []).filter((skillId) => skillId !== phases.id)
  ref.skills = [...originSkills, ...phases.skills]
  console.log('DEBUG::', ref.skills)

  const secondPhasesMessageKey = `npc.${getOriginId(attacker.id)}.phases_${phases.step}`

  const hasMsg = i18n.exists(secondPhasesMessageKey)
  hasMsg && Terminal.log(RED(i18n.t(secondPhasesMessageKey)))
}
