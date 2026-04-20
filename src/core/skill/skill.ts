import i18n from '~/i18n'
import { SKILL_IDS, SkillId } from '~/types'
import { Player } from '../player/Player'
import { Skill } from '../types'
import { SkillExecutor } from './executors'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'

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
        execute: config?.execute || (async () => ({ isSuccess: false, gross: 0, isAggressive: false })),
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
}
