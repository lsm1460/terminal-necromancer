import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Terminal } from '~/core/Terminal'
import { GameContext, NpcSkill } from '~/types'

export const SkillEffectHandlers: Record<
  string,
  (target: CombatUnit, skill: NpcSkill, attacker: CombatUnit, context: GameContext) => void
> = {
  heal: (target, skill) => {
    const healAmount = skill.power
    target.ref.hp = Math.min(target.ref.maxHp, target.ref.hp + healAmount)
    Terminal.log(`💚 ${target.name}의 HP가 ${healAmount}만큼 회복되었습니다.`)
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

    if (!result.isDead && skill.buff) await SkillEffectHandlers.deBuff(...params)
  },
  summon: (target, skill, attacker, context) => {
    const { battle } = context

    if (!skill.options?.spawnMonsterId) {
      Terminal.log(`\n${attacker.name}은/는 ${skill.name}을/를 실패했다..`)
      return
    }

    const reinforcement = battle._spawnMonster(skill.options.spawnMonsterId, context)

    if (!reinforcement) {
      Terminal.log(`\n${attacker.name}은/는 ${skill.name}을/를 실패했다..`)
      return
    }

    // 3. 상황에 맞는 연출 문구 (스킬 ID나 이름으로 판별)
    if (skill.id.includes('divide')) {
      Terminal.log(`🧬 ${attacker.name}에게서 ${reinforcement.name}(이)가 분리되었습니다!`)
    } else {
      Terminal.log(`👾 ${attacker.name}의 부름에 ${reinforcement.name}(이)가 나타났습니다!`)
    }
  },
}
