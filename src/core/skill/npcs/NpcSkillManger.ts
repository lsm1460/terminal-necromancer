import cloneDeep from 'lodash/cloneDeep'
import { Battle } from '~/core/battle/Battle'
import { BattleDirector } from '~/core/battle/BattleDirector'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { EventBus } from '~/core/EventBus'
import { GameEventType, NpcSkill, PassiveDefinition, SpecialSkillLogic } from '~/core/types'
import { BattleTarget } from '~/types'
import { SkillEffectHandlers } from './SkillEffectHandlers'

type SkillExecutor<T = void> = (
  skillId: string,
  attacker: CombatUnit,
  ally: CombatUnit[],
  enemies: CombatUnit<BattleTarget>[],
  battle: Battle
) => T

export class NpcSkillManager {
  private skillData: Record<string, NpcSkill>
  private passiveEffects: Record<string, PassiveDefinition> = {}
  private specialLogics: Record<string, SpecialSkillLogic> = {}

  constructor(
    skillData: any,
    private eventBus: EventBus
  ) {
    this.skillData = skillData
  }

  getSkill(skillId: string) {
    return cloneDeep(this.skillData[skillId])
  }

  public registerLogics(config: {
    passives?: Record<string, PassiveDefinition>
    specials?: Record<string, SpecialSkillLogic>
  }) {
    if (config.passives) this.passiveEffects = { ...this.passiveEffects, ...config.passives }
    if (config.specials) this.specialLogics = { ...this.specialLogics, ...config.specials }
  }

  private getPassive(id: string) {
    return this.passiveEffects[id]
  }

  private getSpecial(id: string): SpecialSkillLogic | undefined {
    return this.specialLogics[id]
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
      case 'ENEMY_RANDOM':
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

    return targets
  }

  execute: SkillExecutor = async (...params) => {
    const [skillId, attacker, ally, enemies, battle] = params
    const skill = this.getSkill(skillId)
    if (!skill) return

    this.eventBus.emitAsync(GameEventType.SKILL_EFFECT_LOG, {
      type: 'execute',
      attackerName: attacker.name,
      skillId: skill.id,
    })

    let targets = this.findTargets(...params)
    if (targets.length === 0) {
      this.eventBus.emitAsync(GameEventType.SKILL_EFFECT_LOG, {
        type: 'not_found',
      })
      return
    }

    BattleDirector.playAttack(attacker.id, skillId)

    const special = this.getSpecial(skillId)
    if (special) {
      await special(attacker, targets, skill, battle)
      return
    }

    const handler = SkillEffectHandlers[skill.type] || SkillEffectHandlers.damage
    for (const target of targets) {
      const _res = await handler(target, skill, attacker, battle)
      _res && this.eventBus.emitAsync(GameEventType.SKILL_EFFECT_LOG, _res)
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

      const hooks = this.getPassive(id)
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
        unit.onAfterAttackHooks.push(async (attacker, defender, options, damage) => {
          await hooks.onAfterAttack!(attacker, defender, skillData, battle, options, damage)
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
