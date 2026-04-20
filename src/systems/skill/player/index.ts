import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { ExecuteSkill, Skill } from '~/core/types'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { SKILL_IDS, SkillId } from '~/types'
import { SkillExecutor } from './necromancer'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'

export const getPlayerSkills = () => {
  // 1. 각 스킬별 고유 설정 (수치 및 실행 로직)
  const skillConfigs: Record<SkillId, Partial<Skill<Necromancer>>> = {
    [SKILL_IDS.RAISE_SKELETON]: {
      cost: 5,
      execute: (p, c) => SkillExecutor.raiseSkeleton(p, c),
    },
    [SKILL_IDS.RECALL_SKELETON]: {
      cost: 0,
      execute: (p, c) => SkillExecutor.recallSkeleton(p, c),
    },
    [SKILL_IDS.FOCUS_FIRE]: {
      attackType: 'ranged',
      cost: 0,
      execute: (p, c, u) => SkillExecutor.focusFire(p, c, u),
    },
    [SKILL_IDS.CORPSE_EXPLOSION]: {
      attackType: 'ranged',
      cost: 8,
      requiredExp: 300,
      requiredLevel: 2,
      unlocks: ['first_boss'],
      execute: (p, c, u) => SkillExecutor.corpseExplosion(p, c, u),
    },
    [SKILL_IDS.SOUL_HARVEST]: {
      attackType: 'ranged',
      cost: 0,
      requiredExp: 500,
      requiredLevel: 2,
      unlocks: ['first_boss'],
      execute: (p, c) => SkillExecutor.soulHarvest(p, c),
    },
    [SKILL_IDS.SOUL_TRANSFER]: {
      attackType: 'ranged',
      cost: 5,
      requiredExp: 600,
      requiredLevel: 3,
      unlocks: ['second_boss'],
      execute: (p, c, u) => SkillExecutor.soulTransfer(p, c, u),
    },
    [SKILL_IDS.CURSE]: {
      attackType: 'ranged',
      cost: 10,
      requiredExp: 1000,
      requiredLevel: 3,
      unlocks: ['second_boss'],
      execute: (p, c, u) => SkillExecutor.curse(p, c, u),
    },
    [SKILL_IDS.BONE_SPEAR]: {
      attackType: 'ranged',
      cost: 7,
      requiredExp: 1500,
      requiredLevel: 5,
      unlocks: ['defeat_caron'],
      execute: (p, c, u) => SkillExecutor.boneSpear(p, c, u),
    },
    [SKILL_IDS.BONE_PRISON]: {
      attackType: 'ranged',
      cost: 8,
      requiredExp: 1200,
      requiredLevel: 5,
      unlocks: ['third_boss'],
      execute: (p, c, u) => SkillExecutor.bonePrison(p, c, u),
    },
    [SKILL_IDS.BONE_STORM]: {
      attackType: 'ranged',
      cost: 20,
      requiredExp: 2000,
      requiredLevel: 7,
      unlocks: ['third_boss'],
      execute: (p, c, u) => SkillExecutor.boneStorm(p, c, u),
    },
  }

  // 2. 공통 주입 로직 (ID와 i18n 자동 매핑)
  return Object.keys(SKILL_IDS).reduce(
    (acc, id) => {
      const skillId = id as SkillId
      const config = skillConfigs[skillId]

      const wrappedExecute: ExecuteSkill<Necromancer> = async (p, c, u) => {
        const cost = config?.cost ?? 0

        // 1. 공통 체크: 자원이 부족하면 즉시 실패 반환
        if (!p.ref.canPay(cost)) {
          // Terminal.log 등 UI 처리는 여기서 하거나 SkillManager에서 처리
          return { isSuccess: false, isAggressive: false, gross: 0 }
        }

        // 2. 실제 스킬 로직 실행
        const originalExecute = config?.execute || (async () => ({ isSuccess: false, gross: 0, isAggressive: false }))
        const result = await originalExecute(p, c, u)

        // 3. 성공했을 때만 자원 소모
        if (result.isSuccess) {
          p.ref.pay(cost)
        }

        return result
      }

      acc[skillId] = {
        id: skillId,
        name: i18n.t(`skill.${skillId}.name`),
        description: i18n.t(`skill.${skillId}.description`),
        unlockHint: i18n.t(`skill.${skillId}.unlockHint`),
        cost: config?.cost ?? 0,
        requiredExp: config?.requiredExp ?? 0,
        requiredLevel: config?.requiredLevel ?? 1,
        unlocks: config?.unlocks ?? [],
        attackType: config?.attackType,
        execute: wrappedExecute,
      } as Skill

      return acc
    },
    {} as Record<SkillId, Skill>
  )
}

export const SkillUtils = {
  canLearn: (player: Player, skill: Skill): boolean => {
    return player.level >= skill.requiredLevel && player.exp >= skill.requiredExp
  },

  async selectCorpse(player: Player, world: World) {
    const corpses = world.getCorpsesAt(player.pos)

    if (corpses.length === 0) {
      Terminal.log('\n💬 ' + i18n.t('skill.no_corpses_nearby'))
      return false
    }

    const corpseChoices = [
      ...corpses.map((c, index) => ({
        name: c.id || index.toString(),
        message: i18n.t('skill.corpse_choice_format', {
          name: c.name,
          hp: c.maxHp,
          atk: c.atk,
        }),
      })),
      { name: 'cancel', message: i18n.t('cancel') },
    ]

    const corpseId = await Terminal.select(i18n.t('skill.select_corpse_to_consume'), corpseChoices)

    if (corpseId === 'cancel') {
      Terminal.log('\n💬 ' + i18n.t('skill.cancel_action'))
      return false
    }

    return corpseId
  },

  sacrificeSkeleton(player: CombatUnit<Necromancer>, skeletonId: string) {
    const isResurrection = player.ref.hasAffix('RESURRECTION')
    const target = player.ref.skeleton.find((sk) => sk.id === skeletonId)

    if (!target) return null

    if (isResurrection) {
      const minHp = Math.floor(target.maxHp * 0.1) // 최대 체력의 10%

      target.hp = Math.min(target.hp, minHp)
    } else {
      // 상태 변경 및 제거
      target.hp = 0
      target.isAlive = false
      player.ref.removeMinion(skeletonId)
    }

    return target
  },

  failWithLog(i18nKey: string) {
    Terminal.log(i18n.t(i18nKey))
    return { isSuccess: false, isAggressive: false, gross: 0 }
  },
}
