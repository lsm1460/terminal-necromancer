import _ from 'lodash'
import { AffixManager } from '~/core/battle/AffixManager'
import { Battle } from '~/core/battle/Battle'
import { BattleDirector } from '~/core/battle/BattleDirector'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { BattleTarget, GameContext, NpcSkill } from '~/types'
import { PASSIVE_EFFECTS } from '../passiveHandlers'
import { SkillEffectHandlers } from './SkillEffectHandlers'
import { SpecialSkillLogics } from './SpecialSkillLogics'

type SkillExecutor<T = void> = (
  skillId: string,
  attacker: CombatUnit,
  ally: CombatUnit[],
  enemies: CombatUnit<BattleTarget>[],
  context: GameContext
) => T

export class NpcSkillManager {
  private skillData: Record<string, NpcSkill>

  /**
   * @param skillData
   * @param player - 스킬 효과 적용을 위한 플레이어 인스턴스
   */
  constructor(
    skillData: any,
    public player: Player
  ) {
    this.skillData = skillData
  }

  getSkill(skillId: string) {
    return {
      ..._.cloneDeep(this.skillData[skillId]),

      get name() {
        return i18n.t(`skill.npc.${skillId}.name`)
      },

      get description() {
        return i18n.t(`skill.npc.${skillId}.description`)
      },
    }
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
        const priorityTarget = enemies.find((e) => e.deBuff.some((b) => b.type === 'focus')) || enemies[0]
        targets = [priorityTarget]
        break
      case 'ENEMY_DOUBLE':
        targets = [enemies[0], enemies[1]].filter((v) => v !== undefined)
        break
      case 'ENEMY_LOWEST_HP':
        if (enemies.length === 0) {
          targets = []
        } else {
          const weakestEnemy = enemies.reduce((p, c) => (p.ref.hp / p.ref.maxHp < c.ref.hp / c.ref.maxHp ? p : c))
          targets = [weakestEnemy]
        }
        break
      case 'ENEMY_BACK':
        targets = enemies.length > 0 ? [enemies[enemies.length - 1]] : []
        break
      case 'RANDOM':
        const randomIndex = Math.floor(Math.random() * enemies.length)
        targets = [enemies[randomIndex]]
        break
      case 'PLAYER':
        targets = [...ally, ...enemies].filter((unit) => unit.type === 'player')
        break
      case 'SELF':
        targets = [attacker]
        break
      default:
        break
    }

    return AffixManager.handleBeforeAttack(this.player, attacker, targets as any)
  }

  execute: SkillExecutor = async (...params) => {
    const [skillId, attacker, ally, enemies, context] = params
    const skill = this.getSkill(skillId)
    if (!skill) return

    Terminal.log(`\n✨ ${attacker.name}의 [${skill.name}]!`)
    Terminal.log(`💬 ${skill.description}`)

    let targets = this.findTargets(...params)
    if (targets.length === 0) {
      Terminal.log(i18n.t('skill.target_not_found'))
      return
    }

    BattleDirector.playAttack(attacker.id, skillId)

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

  getRandomSkill(attacker: CombatUnit): NpcSkill | null {
    const skills = (attacker.ref as BattleTarget).skills || []

    const isExposed = attacker.deBuff.some((d) => d.type === 'expose')

    const available = skills.filter((id) => {
      const skill = this.skillData[id]
      if (!skill) return false
      if (skill.type === 'passive') return false

      if (isExposed && skill.buff?.type === 'stealth') {
        return false
      }

      return Math.random() <= (skill.chance || 0)
    })

    if (available.length < 1) {
      return null
    }

    const npcSkillId = available[Math.floor(Math.random() * available.length)]

    return this.skillData[npcSkillId]
  }

  public setupPassiveHook(unit: CombatUnit, battle: Battle) {
    const skillIds = (unit.ref as any).skills || []

    for (const id of skillIds) {
      const skillData = this.getSkill(id)
      if (!skillData || skillData.type !== 'passive') continue

      const hooks = PASSIVE_EFFECTS[id]
      if (!hooks) continue

      if (hooks.onBeforeAttack) {
        unit.onBeforeAttackHooks.push(async (attacker, defender, options) => {
          await hooks.onBeforeAttack!(attacker, defender, skillData, battle, options)
        })
      }

      // 공통 래퍼 함수: 파라미터를 핸들러 규격에 맞게 매핑
      if (hooks.onAfterHit) {
        unit.onAfterHitHooks.push(async (attacker, defender, options) => {
          await hooks.onAfterHit!(attacker, defender, skillData, battle, options)
        })
      }

      if (hooks.onAfterAttack) {
        unit.onAfterAttackHooks.push(async (attacker, defender, options) => {
          await hooks.onAfterAttack!(attacker, defender, skillData, battle, options)
        })
      }

      if (hooks.onDeath) {
        unit.onDeathHooks.push(async (u, options) => {
          await hooks.onDeath!(u, skillData, battle, options)
        })
      }
    }
  }
}
