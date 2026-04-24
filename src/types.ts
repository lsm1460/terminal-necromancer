import { SkeletonRarity } from './consts'
import { AttackType, BattleTarget, NpcSkill } from './core'

export interface IMinion extends BattleTarget {
  isMinion: true
}

export interface IGolem extends IMinion {
  madeBy: string
  isGolem: true
}

export interface IKnight extends IMinion {
  originId: string
  isKnight: true
}

export type SkeletonBase = {
  id: string
  name: string
  attackType: AttackType
  maxHp: number
  hp: number
  atk: number
  def: number
  agi: number
  eva: number
  skills: string[]
  exp: number
  description: string
  originId: string
  rarity: SkeletonRarity
  dropTableId: string
  encounterRate: number
  isAlive: boolean
  isMinion: boolean
  isSkeleton: boolean
  orderWeight: number
}

export interface ISkeleton extends IMinion {
  originId: string
  rarity: SkeletonRarity
  isSkeleton: true
}

export const SKILL_IDS = {
  RAISE_SKELETON: 'RAISE_SKELETON',
  RECALL_SKELETON: 'RECALL_SKELETON',
  FOCUS_FIRE: 'FOCUS_FIRE',
  SOUL_HARVEST: 'SOUL_HARVEST',
  CORPSE_EXPLOSION: 'CORPSE_EXPLOSION',
  SOUL_TRANSFER: 'SOUL_TRANSFER',
  CURSE: 'CURSE',
  BONE_SPEAR: 'BONE_SPEAR',
  BONE_PRISON: 'BONE_PRISON',
  BONE_STORM: 'BONE_STORM',
} as const

// 2. 위 객체의 값들만 모아서 타입으로 추출
export type SkillId = (typeof SKILL_IDS)[keyof typeof SKILL_IDS]

export type PhasesShift = {
  skills: string[]
  chance: number
  step: number
} & NpcSkill

export type BroadcastScript = {
  hostile: string[]
  normal: string[]
}
