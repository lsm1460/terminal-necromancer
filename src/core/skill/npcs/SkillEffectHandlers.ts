import { Battle } from '~/core/battle'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { NpcSkill, SkillEffectResult } from '~/core/types'

export const SkillEffectHandlers: Record<
  string,
  (
    target: CombatUnit,
    skill: NpcSkill,
    attacker: CombatUnit,
    battle: Battle
  ) => Promise<SkillEffectResult | void> | SkillEffectResult | void
> = {
  heal: (target, skill, attacker) => {
    const healAmount = Math.floor(target.ref.maxHp * skill.power)
    target.ref.hp = Math.min(target.ref.maxHp, target.ref.hp + healAmount)

    return {
      type: 'heal',
      skillId: skill.id,
      attackerName: attacker.name,
      targetName: target.name,
      payload: { amount: healAmount },
    }
  },

  buff: (target, skill, attacker) => {
    if (skill.buff) {
      target.applyBuff(skill.buff)
      return {
        type: 'buff',
        skillId: skill.id,
        attackerName: attacker.name,
        targetName: target.name,
        payload: { buff: skill.buff },
      }
    }
  },

  deBuff: (target, skill, attacker) => {
    if (skill.buff) {
      target.applyDeBuff(skill.buff)
      return {
        type: 'deBuff',
        skillId: skill.id,
        attackerName: attacker.name,
        targetName: target.name,
        payload: { buff: skill.buff },
      }
    }
  },

  damage: async (target, skill, attacker, battle) => {
    const result = await target.executeHit(attacker, {
      skillAtkMult: skill.power,
      ...(skill.options || {}),
      attackType: skill.attackType,
    })

    // 데미지 후 추가 디버프 효과가 있다면 연쇄 호출
    let subEffect
    if (!result.isDead && skill.buff) {
      subEffect = SkillEffectHandlers.deBuff(target, skill, attacker, battle)
    }

    return {
      type: 'damage',
      skillId: skill.id,
      attackerName: attacker.name,
      targetName: target.name,
      payload: { hitResult: result, subEffect },
    }
  },

  summon: (target, skill, attacker, battle) => {
    const spawnId = skill.options?.spawnMonsterId
    if (!spawnId) {
      return {
        type: 'summon_fail',
        skillId: skill.id,
        attackerName: attacker.name,
        targetName: target.name,
        payload: { reason: 'no_id' },
      }
    }

    const reinforcement = battle._spawnMonster(spawnId)

    if (!reinforcement) {
      return {
        type: 'summon_fail',
        skillId: skill.id,
        attackerName: attacker.name,
        targetName: target.name,
        payload: { reason: 'spawn_failed' },
      }
    }

    return {
      type: 'summon_success',
      skillId: skill.id,
      attackerName: attacker.name,
      targetName: reinforcement.name, // 소환된 대상의 이름
      payload: {
        isDivide: skill.id.includes('divide'),
        reinforcementName: reinforcement.name,
      },
    }
  },
}
