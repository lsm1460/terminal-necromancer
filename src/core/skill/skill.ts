import { SKILL_IDS, Skill, SkillId } from '../../types'
import { Player } from '../Player'
import { SkillExecutor } from './executors'

export const SKILL_LIST: Record<SkillId, Skill> = {
  [SKILL_IDS.RAISE_SKELETON]: {
    id: SKILL_IDS.RAISE_SKELETON,
    name: '스켈레톤 생성',
    description: '시체를 소모하여 해골 병사를 소환합니다.',
    cost: 10,
    requiredLevel: 1,
    unlocks: [],
    unlockHint: '',
    execute: (player, context, args: string[]) => SkillExecutor.raiseSkeleton(player, context, args[0]),
  },
  [SKILL_IDS.SOUL_HARVEST]: {
    id: SKILL_IDS.SOUL_HARVEST,
    name: '영혼 흡수',
    description: '시체에서 정수를 뽑아내 마나로 전환합니다.',
    cost: 0,
    requiredLevel: 2,
    unlocks: ['first_boss'],
    unlockHint: '지하 2층 정화 완료',
    execute: (player, context, args: string[]) => SkillExecutor.soulHarvest(player, context, args[0]),
  },
  [SKILL_IDS.CORPSE_EXPLOSION]: {
    id: SKILL_IDS.CORPSE_EXPLOSION,
    name: '시체 폭발',
    description: '시체를 폭파시켜 광역 피해를 입힙니다.',
    cost: 15,
    requiredLevel: 3,
    unlocks: ['first_boss'],
    unlockHint: '지하 2층 정화 완료',
    execute: (player, context, args, enemies) => SkillExecutor.corpseExplosion(player, context, args[0], enemies),
  },
  
}

export const SkillUtils = {
  canLearn: (player: Player, skillId: SkillId): boolean => {
    return player.level >= SKILL_LIST[skillId].requiredLevel
  },
}
