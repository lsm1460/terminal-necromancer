import fs from 'fs'
import path from 'path'
import { BattleTarget, NpcSkill } from '../../types'
import { CombatUnit } from '../Battle'

type SkillExecutor<T = void> = (
  skillId: string,
  attacker: CombatUnit,
  ally: CombatUnit[],
  enemies: CombatUnit[]
) => T

export class NpcSkillManager {
  private skillData: Record<string, NpcSkill>

  constructor(skillPath: string) {
    this.skillData = JSON.parse(fs.readFileSync(path.resolve(skillPath), 'utf-8'))
  }

  getSkill(skillId: string) {
    return this.skillData[skillId]
  }

  findTargets: SkillExecutor<CombatUnit[]> = (skillId, attacker, ally, enemies) => {
    const skill = this.getSkill(skillId)

    switch (skill.targetType) {
      case 'SINGLE_BUFF':
        return [attacker]
      case 'ENEMY_SINGLE':
        return [enemies[0]]
      case 'ENEMY_BACK':
        return enemies.length > 0 ? [enemies[enemies.length - 1]] : []
      case 'ENEMY_ALL':
        return enemies // 플레이어 파티가 있다면 확장
      case 'ALLY_LOWEST_HP':
        const weakest = ally.reduce((p, c) => (p.ref.hp / p.ref.maxHp < c.ref.hp / c.ref.maxHp ? p : c))
        return [weakest]
      case 'ALLY_ALL_HP':
        return ally
      default:
        return []
    }
  }

  execute: SkillExecutor = (...params) => {
    const [skillId, attacker, ally, enemies] = params

    const skill = this.getSkill(skillId)
    if (!skill) return

    // 1. 타겟 배열 정의
    let targets = this.findTargets(...params)

    if (targets.length === 0) return

    console.log(`\n✨ ${attacker.name}의 [${skill.name}]!`)
    console.log(`💬 ${skill.description}`)

    // 3. 모든 타겟에게 효과 적용 (forEach 활용)
    const isHeal = skill.targetType.endsWith('_HP')

    targets.forEach((target) => {
      if (isHeal) {
        const healAmount = skill.power
        target.ref.hp = Math.min(target.ref.maxHp, target.ref.hp + healAmount)
        console.log(`💚 ${target.name}의 HP가 ${healAmount}만큼 회복되었습니다.`)
      } else {
        const damage = Math.floor(attacker.stats.atk * skill.power)
        target.ref.hp -= damage
        console.log(`💥 ${target.name}에게 ${damage}의 피해! (남은 HP: ${Math.max(0, target.ref.hp)})`)
      }
    })
  }

  getRandomSkillId(skills: string[]): string | null {
    const available = skills.filter((id) => Math.random() <= (this.skillData[id]?.chance || 0))

    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null
  }
}
