import { SkeletonRarity } from './consts'
import { BaseNPC } from './core/npc/BaseNPC'
import { AttackType, GameContext, NpcSkill } from './core/types'
import { AppContext } from './systems/types'

export type BattleTarget = {
  id: string
  name: string
  attackType: AttackType
  baseMaxHp?: number
  maxHp: number
  hp: number
  baseAtk?: number
  atk: number
  baseDef?: number
  def: number
  agi: number
  exp: number
  eva?: number
  crit?: number
  description: string
  dropTableId: string
  encounterRate: number // ← 개별 몬스터 출현 확률 (%)
  isAlive: boolean
  skills?: string[]
  preemptive?: boolean
  noEscape?: boolean
  noCorpse?: boolean
  isNpc?: boolean
  isMinion?: boolean
  isSkeleton?: boolean // only skeleton
  originId?: string // only skeleton
  rarity?: SkeletonRarity // only skeleton
  isGolem?: boolean // only golem
  madeBy?: string // only golem
  isKnight?: boolean
  deathLine?: string
  minRebornRarity?: SkeletonRarity
  orderWeight?: number
}

export type MonsterGroupMember = {
  id: string
  encounterRate: number
}



export type Direction = 'up' | 'down' | 'left' | 'right'
export type Vector = { dx: number; dy: number }



export type Corpse = {
  x?: number
  y?: number
  maxHp: number
  atk: number
  def: number
  agi: number
  name: string
  id: string
  minRebornRarity?: SkeletonRarity
}

export type LootBag = {
  id: string
  scendId: string
  tileId: string
  exp: number
  gold: number
}

export interface Renderer {
  print(message: string): void
  update(message: string): void
  availableTalks(list: { name: string; hasQuest: boolean }[]): void
  clear(): void
  printStatus(context: AppContext): void
  // 입력 관련 메서드 추가
  select(message: string, choices: { name: string; message: string }[], defaultValue?: string): Promise<string>
  confirm(message: string): Promise<boolean>
  prompt(message: string): Promise<void> // 기존의 alert 역할을 prompt로 명칭 변경
  multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number }
  ): Promise<string[]>
  move(directions: string[]): void
  look(message: string, name: string, type: string): void
  pick(name: string, message: string): void
  attack(message: string, prefix?: string): void
  skill(message: string, prefix?: string): void
  talk(name: string): void
  printNpcCard(npc: BaseNPC): void
}

export type CommandFunction = (args: string[], context: AppContext) => boolean | string | Promise<boolean | string>

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

export type GameEvent = {
  id: string
  name: string
  description: string
  withMonster?: string
  postTalk?: string[]
  defeatTalk?: string[]
}

export type PhasesShift = {
  skills: string[]
  chance: number
  step: number
} & NpcSkill

export type BroadcastScript = {
  hostile: string[]
  normal: string[]
}

export interface UnitSprites {
  idle: HTMLImageElement[]
  attack: HTMLImageElement | null
  hit: HTMLImageElement | null
  die: HTMLImageElement | null
  escape: HTMLImageElement | null
  isFallback?: boolean
}

