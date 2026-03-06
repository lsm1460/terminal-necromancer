import { SkeletonRarity } from './consts'
import { Battle, Buff, CalcDamageOptions } from './core/battle/Battle'
import { CombatUnit } from './core/battle/unit/CombatUnit'
import { Broadcast } from './core/Broadcast'
import { ItemRarity } from './core/item/consts'
import { MapManager } from './core/MapManager'
import { MonsterFactory } from './core/MonsterFactory'
import { NPCManager } from './core/NpcManager'
import { Player } from './core/player/Player'
import { World } from './core/World'
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'
import { SaveSystem } from './systems/SaveSystem'

export type AttackType = 'melee' | 'ranged' | 'explode'

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
  isSkeleton?: boolean
  isGolem?: boolean
  isKnight?: boolean
  deathLine?: string
  minRebornRarity?: SkeletonRarity
  orderWeight?: number
}

export type MonsterGroupMember = {
  id: string
  encounterRate: number
}

export interface Monster extends BattleTarget {
  drops: Item[]
}

export interface Tile {
  id: string
  theme: string
  event: string
  dialogue: string
  observe: string
  npcIds?: string[] // npc용
  spawn_limit?: number // monster용
  monsters?: Monster[]
  isClear?: boolean
  isSeen?: boolean
}

export interface MapData {
  tiles: Tile[][]
}

export type LevelData = {
  level: number
  expRequired: number
  atk: number
  def: number
  hp: number
  mp: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'
export type Vector = { dx: number; dy: number }

export enum ItemType {
  ITEM = 'item',
  WEAPON = 'weapon',
  ARMOR = 'armor',
  FOOD = 'food',
  CONSUMABLE = 'consumable',
  QUEST = 'quest',
}

type BaseItem = {
  id: string
  type: ItemType
  label: string
  description: string
  quantity?: number
  price: number
  sellPrice: number
  rarity?: ItemRarity
}

// 일반 아이템 (재료 등)
export type GenericItem = BaseItem & {
  type: ItemType.ITEM
}

// 일반 아이템 (퀘스트용)
export type QuestItem = BaseItem & {
  type: ItemType.QUEST
}

type ItemOptions = {
  hp?: number
  mp?: number
  maxSkeleton?: number
  affix?: Affix
}

// 무기
export type WeaponItem = BaseItem &
  ItemOptions & {
    type: ItemType.WEAPON
    atk: number
    crit: number
    attackType: AttackType
    minRebornRarity?: number
  }

// 방어구
export type ArmorItem = BaseItem &
  ItemOptions & {
    type: ItemType.ARMOR
    def: number
    eva?: number
    minRebornRarity?: number
  }

// 음식
export type FoodItem = BaseItem & {
  type: ItemType.FOOD
  hpHeal: number
}

// 소비 아이템 (포션 등)
export type ConsumableItem = BaseItem & {
  type: ItemType.CONSUMABLE
  hpHeal?: number
  mpHeal?: number
}

export type Item = GenericItem | WeaponItem | ArmorItem | FoodItem | ConsumableItem | QuestItem

export type Drop = {
  x: number
  y: number
  atkRange?: [number, number]
  defRange?: [number, number]
  maxSkeletonRange?: [number, number]
  critRange?: [number, number]
  evaRange?: [number, number]
  minRarity?: ItemRarity
  maxRarity?: ItemRarity
} & Item

export type Corpse = {
  x?: number
  y?: number
} & BattleTarget

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
  clear(): void
  printStatus(player: Player, context: GameContext): void
  // 입력 관련 메서드 추가
  select(message: string, choices: { name: string; message: string }[]): Promise<string>
  confirm(message: string): Promise<boolean>
  prompt(message: string): Promise<void> // 기존의 alert 역할을 prompt로 명칭 변경
  multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number }
  ): Promise<string[]>
}

export interface GameContext {
  map: MapManager
  npcs: NPCManager
  world: World
  events: EventSystem
  drop: DropSystem
  save: SaveSystem
  battle: Battle
  broadcast: Broadcast
  monster: MonsterFactory

  pendingAction?: (input: string) => void // 특수 프롬프트 응답 처리용 콜백
}

export type CommandFunction = (
  player: Player,
  args: string[],
  context: GameContext
) => boolean | string | Promise<boolean | string>

type NPCScripts = {
  greeting: string
  farewell: string
}

export interface NPC extends BattleTarget {
  id: string
  faction: string
  reborn: boolean
  lines: string[]
  relation: number
  isNpc: true
  isHostile: boolean
  isBoss: boolean
  factionHostility: number
  factionContribution: number
  updateHostility: (amount: number) => void
  dead: (_karma?: number) => void
  noEscape?: boolean
  scripts?: {
    friendly: NPCScripts
    normal: NPCScripts
    hostile: NPCScripts
  }
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

export type SkillResult = {
  isSuccess: boolean
  isAggressive: boolean
  gross: number
}

export type ExecuteSkill = (
  player: CombatUnit<Player>,
  context: GameContext,
  units?: {
    ally?: CombatUnit[]
    enemies?: CombatUnit[]
  }
) => Promise<SkillResult>

// 3. 스킬 인터페이스 정의
export interface Skill {
  id: SkillId
  name: string
  attackType?: AttackType
  description: string
  cost: number
  requiredExp: number
  requiredLevel: number
  unlocks: string[]
  unlockHint: string
  execute: ExecuteSkill
}

export interface NPCState {
  hp: number
  isAlive: boolean
  reborn: boolean
  relation: number // 호감도 등 확장용
}

export type GameEvent = {
  id: string
  name: string
  description: string
  withMonster?: string
  postTalk?: string[]
  defeatTalk?: string[]
}

export type SkillTargetType =
  | 'ENEMY_SINGLE'
  | 'ENEMY_DOUBLE'
  | 'ENEMY_BACK'
  | 'ENEMY_LOWEST_HP'
  | 'ENEMY_ALL'
  | 'ALLY_SINGLE'
  | 'ALLY_LOWEST_HP'
  | 'ALLY_ALL'
  | 'SINGLE_BUFF'
  | 'RANDOM'
  | 'SELF'
  | 'PLAYER'

export type NpcSkill = {
  id: string
  name: string
  attackType?: AttackType
  description: string
  chance: number
  power: number
  targetType: SkillTargetType
  type: string // "physical", "dark", "holy" 등 자유롭게 확장 가능
  buff?: Buff
  options?: CalcDamageOptions & {
    spawnMonsterId?: string
  }
}

export type AffixId =
  | 'SURPRISE_ATTACK'
  | 'OVERLORD'
  | 'ELITE_SQUAD'
  | 'DOOMSDAY'
  | 'FROSTBORNE'
  | 'LEGION'
  | 'THORNS'
  | 'ROAR'
  | 'TABOO'
  | 'WARHORSE'
  | 'CORROSION'
  | 'WIDE_CURSE'
  | 'CHAIN_EXPLOSION'
  | 'VAMPIRISM'
  | 'EXALTATION'
  | 'BLOOD'
  | 'RESURRECTION'
  | 'MEMORY'
  | 'CLEANSE'

export interface Affix {
  id: AffixId // 고유 식별자
  name: string // 이름 (예: "군주", "군단")
  description: string // 툴팁용 설명
  valueRange?: [number, number]
  value?: number
  metadata?: {
    needsConfirmOnUnequip?: boolean // 장비 해제 시 확인창 노출 여부 (기억 어픽스용)
    unEquipCaution?: string // 장비 해제 시 경고문
    [key: string]: any
  }
}

export type BroadcastScript = {
  hostile: string[]
  normal: string[]
}

export interface UnitSprites {
  idle: HTMLImageElement[];
  attack: HTMLImageElement | null;
  hit: HTMLImageElement | null;
  die: HTMLImageElement | null;
  escape: HTMLImageElement | null;
}

export interface SceneData {
  displayName: string
  unlocks?: string[]
  start_pos: { x: number; y: number }
  move_pos?: { x: number; y: number }
  tiles: Tile[][]
}