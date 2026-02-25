import fs from 'fs'
import path from 'path'
import { BattleTarget, GameContext, ItemType, NpcSkill } from '~/types'
import { Player } from '../player/Player'
import { CombatUnit } from '../battle/CombatUnit'
import _ from 'lodash'
import { PASSIVE_EFFECTS } from './passiveHandlers'
import { Battle } from '../battle/Battle'

const SkillEffectHandlers: Record<
  string,
  (target: CombatUnit, skill: NpcSkill, attacker: CombatUnit, context: GameContext) => void
> = {
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
      console.log(`\n${attacker.name}은/는 ${skill.name}을/를 실패했다..`)
      return
    }

    const reinforcement = battle._spawnMonster(skill.options.spawnMonsterId, context)

    if (!reinforcement) {
      console.log(`\n${attacker.name}은/는 ${skill.name}을/를 실패했다..`)
      return
    }

    // 3. 상황에 맞는 연출 문구 (스킬 ID나 이름으로 판별)
    if (skill.id.includes('divide')) {
      console.log(`🧬 ${attacker.name}에게서 ${reinforcement.name}(이)가 분리되었습니다!`)
    } else {
      console.log(`👾 ${attacker.name}의 부름에 ${reinforcement.name}(이)가 나타났습니다!`)
    }
  },
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
      await target.executeHit(attacker, {
        attackType: 'explode',
        rawDamage: Math.floor(attacker.ref.hp * skill.power),
      })
    }
    // 2. 시전자 즉사 처리
    console.log(`💀 ${attacker.name}(은)는 모든 힘을 쏟아내고 소멸했습니다!`)

    attacker.dead()
  },

  health_drain: async (attacker, targets, skill) => {
    let totalDamageDealt = 0

    for (const target of targets) {
      const result = await target.executeHit(attacker, {
        skillAtkMult: skill.power,
        attackType: skill.attackType,
      })

      totalDamageDealt += result.damage || 0
    }

    const healAmount = Math.ceil(totalDamageDealt * 0.5)
    if (healAmount > 0) {
      attacker.ref.hp = Math.min(attacker.ref.maxHp, attacker.ref.hp + healAmount)
      console.log(`💉 ${attacker.name}(이)가 적의 생명력을 흡수하여 HP를 ${healAmount}만큼 회복했습니다!`)
    }
  },
  item_steal: async (attacker, targets, skill) => {
    for (const target of targets) {
      await target.executeHit(attacker, {
        skillAtkMult: skill.power,
        attackType: skill.attackType,
      })

      if (target.type !== 'player') {
        console.log(` > ${target.name}(은)는 훔칠 물건이 없습니다.`)
        continue
      }

      const player = target.ref as Player

      const isGoldSteal = Math.random() < 0.5

      const stealableCandidates = player.inventory?.filter((item) => item.type !== ItemType.QUEST) || []

      if (isGoldSteal && player.gold > 0) {
        // 골드 탈취: 고정 수치와 비율 중 작은 값을 선택해 파산 방지
        const stealAmount = Math.min(player.gold, Math.floor(10 + player.gold * 0.05))
        player.gold -= stealAmount
        console.log(
          ` \x1b[33m[!] 소매치기!\x1b[0m ${attacker.name}(이)가 \x1b[33m${stealAmount}G\x1b[0m를 훔쳐 달아납니다!`
        )
      } else if (stealableCandidates.length > 0) {
        // 3. 필터링된 후보 중에서만 랜덤 선택
        const targetItem = stealableCandidates[Math.floor(Math.random() * stealableCandidates.length)]

        // 실제 인벤토리에서 해당 아이템의 인덱스를 찾아 제거
        const actualIndex = player.inventory.findIndex((item) => item === targetItem)
        if (actualIndex !== -1) {
          player.inventory.splice(actualIndex, 1)
          console.log(
            ` \x1b[31m[!] 분실!\x1b[0m ${attacker.name}(이)가 배낭에서 \x1b[90m'${targetItem.label}'\x1b[0m을(를) 훔쳐 달아납니다!`
          )
        }
      } else {
        // 훔칠 골드도 없고, 훔칠 수 있는 일반 아이템도 없을 때
        console.log(` > ${attacker.name}(이)가 당신의 주머니를 뒤졌지만, 땡전 한 푼 나오지 않습니다.`)
      }
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
    return _.cloneDeep(this.skillData[skillId])
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
