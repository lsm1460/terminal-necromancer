import fs from 'fs'
import path from 'path'
import { BattleTarget, GameContext, NpcSkill } from '../../types'
import { Player } from '../Player'
import { CombatUnit } from '../battle/CombatUnit'

const SkillEffectHandlers: Record<string, (target: CombatUnit, skill: NpcSkill, attacker: CombatUnit, context: GameContext) => void> = {
  heal: (target, skill) => {
    const healAmount = skill.power
    target.ref.hp = Math.min(target.ref.maxHp, target.ref.hp + healAmount)
    console.log(`💚 ${target.name}의 HP가 ${healAmount}만큼 회복되었습니다.`)
  },
  buff: (target, skill) => {
    if (skill.buff) target.applyBuff(skill.buff)
  },
  deBuff: (target, skill) => {
    if (skill.buff) target.applyDeBuff(skill.buff)
  },
  damage: async (target, skill, attacker) => {
    await target.takeDamage(attacker, {
      skillAtkMult: skill.power,
      ...(skill.options || {}),
    })
  },
  summon: (target, skill, attacker, context) => {
    const { battle } = context

    if (!skill.options?.spawnMonsterId) {
      console.log(`\n${attacker.name}은/는 ${skill.name}을/를 실패했다..`)
      return
    }

    const reinforcement = battle.spawnMonster(skill.options.spawnMonsterId, context)

    if (!reinforcement) {
      console.log(`\n${attacker.name}은/는 ${skill.name}을/를 실패했다..`)
      return
    }

    console.log(`📢 ${attacker.name}의 [${skill.name}]!`)

    // 3. 상황에 맞는 연출 문구 (스킬 ID나 이름으로 판별)
    if (skill.id.includes('divide')) {
      console.log(`🧬 ${attacker.name}에게서 ${reinforcement.name}(이)가 분리되었습니다!`)
    } else {
      console.log(`👾 ${attacker.name}의 부름에 ${reinforcement.name}(이)가 나타났습니다!`)
    }
  }
}

// B. 스킬 ID별 특수 로직 (시전자나 전장에 특별한 변화가 생길 때)
const SpecialSkillLogics: Record<
  string,
  (attacker: CombatUnit, targets: CombatUnit[], skill: NpcSkill) => Promise<void>
> = {
  // 자폭
  self_destruct: async (attacker, targets, skill) => {
    // 1. 모든 대상에게 데미지 적용
    for (const target of targets) {
      await target.takeDamage(attacker, { rawDamage: Math.floor(attacker.ref.hp * skill.power) })
    }
    // 2. 시전자 즉사 처리
    console.log(`💀 ${attacker.name}(은)는 모든 힘을 쏟아내고 소멸했습니다!`)
    attacker?.onDeath?.()
  },

  health_drain: async (attacker, targets, skill) => {
    let totalDamageDealt = 0

    for (const target of targets) {
      const result = await target.takeDamage(attacker, {
        skillAtkMult: skill.power,
      })

      totalDamageDealt += result.damage || 0
    }

    // 2. 입힌 데미지의 일정 비율만큼 시전자 회복 (예: 데미지의 50%)
    const healAmount = Math.floor(totalDamageDealt * 0.5)
    if (healAmount > 0) {
      attacker.ref.hp = Math.min(attacker.ref.maxHp, attacker.ref.hp + healAmount)
      console.log(`💉 ${attacker.name}(이)가 적의 생명력을 흡수하여 HP를 ${healAmount}만큼 회복했습니다!`)
    }
  },
}

type SkillExecutor<T = void> = (
  skillId: string,
  attacker: CombatUnit,
  ally: CombatUnit[],
  enemies: CombatUnit<BattleTarget>[],
  context: GameContext
) => T

export class NpcSkillManager {
  private skillData: Record<string, NpcSkill>

  constructor(
    skillPath: string,
    public player: Player
  ) {
    this.skillData = JSON.parse(fs.readFileSync(path.resolve(skillPath), 'utf-8'))
  }

  getSkill(skillId: string) {
    return this.skillData[skillId]
  }

  findTargets: SkillExecutor<CombatUnit[]> = (skillId, attacker, ally, enemies) => {
    const skill = this.getSkill(skillId)

    let targets: CombatUnit[] = []

    switch (skill.targetType) {
      case 'SINGLE_BUFF':
        return [attacker]
      case 'ALLY_LOWEST_HP':
        const weakest = ally.reduce((p, c) => (p.ref.hp / p.ref.maxHp < c.ref.hp / c.ref.maxHp ? p : c))
        return [weakest]
      case 'ALLY_ALL':
        return ally
      case 'ENEMY_ALL':
        return enemies // 플레이어 파티가 있다면 확장
      case 'ENEMY_SINGLE':
        targets = [enemies[0]]
        break
      case 'ENEMY_BACK':
        targets = enemies.length > 0 ? [enemies[enemies.length - 1]] : []
        break
      case 'RANDOM':
        const randomIndex = Math.floor(Math.random() * enemies.length)
        targets = [enemies[randomIndex]]
        break
      case 'SELF':
        targets = [attacker]
        break
      default:
        break
    }

    if (this.player.hasAffix('ROAR') && ['npc', 'monster'].includes(attacker.type)) {
      const golem = enemies.find((enemy) => enemy.ref.isGolem && enemy.ref.isAlive)

      if (golem) {
        // 🔊 상황에 맞는 로그 출력
        console.log(
          `\n[📢 포효]: 골렘의 엔진이 과부하되며 굉음을 내지릅니다! ${attacker.name}의 시선이 골렘에게 고정됩니다.`
        )

        return [golem]
      }
    }

    return targets
  }

  execute: SkillExecutor = async (...params) => {
    const [skillId, attacker, ally, enemies, context] = params
    const skill = this.getSkill(skillId)
    if (!skill) return

    console.log(`\n✨ ${attacker.name}의 [${skill.name}]!`)
    console.log(`💬 ${skill.description}`)

    let targets = this.findTargets(...params)
    if (targets.length === 0) {
      console.log(`하지만 대상을 찾을 수 없었다..`)
      return
    }

    // 1. 특수 로직(ID 기반)이 있는지 먼저 확인
    if (SpecialSkillLogics[skillId]) {
      await SpecialSkillLogics[skillId](attacker, targets, skill)
      return
    }

    // 2. 특수 로직이 없다면 공통 타입(Type 기반) 핸들러 실행
    const handler = SkillEffectHandlers[skill.type] || SkillEffectHandlers.damage
    for (const target of targets) {
      await handler(target, skill, attacker, context)
    }
  }

  getRandomSkillId(skills: string[]): string | null {
    const available = skills.filter((id) => Math.random() <= (this.skillData[id]?.chance || 0))

    if (available.length < 1) {
      return null
    }

    const npcSkillId = available[Math.floor(Math.random() * available.length)]
    
    return this.skillData[npcSkillId].id
  }
}
