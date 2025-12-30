import { SKILL_GROUPS } from '../consts'
import { SKILL_IDS, Skill, SkillId } from '../types'
import { SkillExecutor } from './SkillExecutor'

export const SKILL_LIST: Record<SkillId, Skill> = {
  [SKILL_IDS.RAISE_SKELETON]: {
    id: SKILL_IDS.RAISE_SKELETON,
    name: '스켈레톤 생성',
    description: '시체를 소모하여 해골 병사를 소환합니다.',
    cost: 10,
    execute: (player, context, args) => SkillExecutor.raiseSkeleton(player, context, args[0]),
  },
  [SKILL_IDS.CORPSE_EXPLOSION]: {
    id: SKILL_IDS.CORPSE_EXPLOSION,
    name: '시체 폭발',
    description: '시체를 폭파시켜 광역 피해를 입힙니다.',
    cost: 15,
    execute: (player, context, args) => {
      /* 로직 */
    },
  },
  [SKILL_IDS.SOUL_HARVEST]: {
    id: SKILL_IDS.CORPSE_EXPLOSION,
    name: '시체 흡수',
    description: '시체에서 정수를 뽑아내 마나로 전환합니다.',
    cost: 15,
    execute: (player, context, args) => {
      /* 로직 */
    },
  },
}

export const SkillNameMap: Record<string, SkillId> = Object.entries(SKILL_GROUPS).reduce(
  (acc, [id, aliases]) => {
    aliases.forEach((alias) => {
      acc[alias] = id as SkillId
    })
    return acc
  },
  {} as Record<string, SkillId>
)
