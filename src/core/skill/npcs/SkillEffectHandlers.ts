import { Battle } from '~/core/battle'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { NpcSkill } from '~/types'

export const SkillEffectHandlers: Record<
  string,
  (target: CombatUnit, skill: NpcSkill, attacker: CombatUnit, battle: Battle) => void
> = {
  heal: (target, skill) => {
    const healAmount = Math.floor(target.ref.maxHp * skill.power)
    target.ref.hp = Math.min(target.ref.maxHp, target.ref.hp + healAmount)

    Terminal.log(
      i18n.t('skill.effect.heal', {
        target: target.name,
        amount: healAmount,
      })
    )
  },
  buff: (target, skill) => {
    if (skill.buff) target.applyBuff(skill.buff)
  },
  deBuff: (target, skill) => {
    if (skill.buff) target.applyDeBuff(skill.buff)
  },
  damage: async (...params) => {
    const [target, skill, attacker] = params

    const result = await target.executeHit(attacker, {
      skillAtkMult: skill.power,
      ...(skill.options || {}),
      attackType: skill.attackType,
    })

    if (!result.isDead && skill.buff) {
      await SkillEffectHandlers.deBuff(...params)
    }
  },

  summon: (target, skill, attacker, battle) => {
    if (!skill.options?.spawnMonsterId) {
      Terminal.log(
        i18n.t('skill.effect.summon.fail', {
          attacker: attacker.name,
          skillName: skill.name,
        })
      )
      return
    }

    const reinforcement = battle._spawnMonster(skill.options.spawnMonsterId)

    if (!reinforcement) {
      Terminal.log(
        i18n.t('skill.effect.summon.fail', {
          attacker: attacker.name,
          skillName: skill.name,
        })
      )
      return
    }

    if (skill.id.includes('divide')) {
      Terminal.log(
        i18n.t('skill.effect.summon.divide', {
          attacker: attacker.name,
          reinforcement: reinforcement.name,
        })
      )
    } else {
      Terminal.log(
        i18n.t('skill.effect.summon.call', {
          attacker: attacker.name,
          reinforcement: reinforcement.name,
        })
      )
    }
  },
}
