import fs from 'fs'
import path from 'path'
import { NpcSkill } from '../../types'
import { CombatUnit } from '../Battle'
import { Player } from '../Player'

type SkillExecutor<T = void> = (
  skillId: string,
  attacker: CombatUnit,
  ally: CombatUnit[],
  enemies: CombatUnit[],
  callback?: () => void
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
    const [skillId, attacker] = params

    const skill = this.getSkill(skillId)
    if (!skill) return

    console.log(`\n✨ ${attacker.name}의 [${skill.name}]!`)
    console.log(`💬 ${skill.description}`)

    // 1. 타겟 배열 정의
    let targets = this.findTargets(...params)

    if (targets.length === 0) {
      console.log(`하지만 ${attacker.name}은/는 대상을 찾을 수 없었다..`)
      return
    }

    // 3. 모든 타겟에게 효과 적용 (forEach 활용)
    const isHeal = skill.type === 'heal'
    const isBuff = skill.type === 'buff'
    const isDeBuff = skill.type === 'deBuff'

    for (const target of targets) {
      if (isHeal) {
        const healAmount = skill.power
        target.ref.hp = Math.min(target.ref.maxHp, target.ref.hp + healAmount)
        console.log(`💚 ${target.name}의 HP가 ${healAmount}만큼 회복되었습니다.`)
      } else if (isBuff && skill.buff) {
        target.applyBuff(skill.buff)
      } else if (isDeBuff && skill.buff) {
        target.applyDeBuff(skill.buff)
      } else {
        await target.takeDamage(attacker, {
          skillAtkMult: skill.power, // 스킬의 위력(배율) 전달
          ...(skill.options || {}),
        })
      }
    }
  }

  getRandomSkillId(skills: string[]): string | null {
    const available = skills.filter((id) => Math.random() <= (this.skillData[id]?.chance || 0))

    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null
  }
}
