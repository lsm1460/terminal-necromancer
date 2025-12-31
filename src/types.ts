import { MapManager } from './core/MapManager'
import { NPCManager } from './core/NpcManager'
import { Player } from './core/Player'
import { World } from './core/World'
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'

export type BattleTarget = {
  id: string
  name: string
  hp: number
  atk: number
  def: number
  eva: number
  exp: number
  description: string
  dropTableId: string
  gold: number
  encounterRate: number // ← 개별 몬스터 출현 확률 (%)
  isAlive: boolean
  preemptive?: boolean
  noEscape?: boolean
}

export interface Monster extends BattleTarget {
  encounterRate: number // ← 개별 몬스터 출현 확률 (%)
  drops: Item[]
}

export interface Tile {
  theme: string
  event: string
  dialogue: string
  npcIds?: string[] // npc용
  spawn_limit?: number // monster용
  currentMonster?: Monster
}

export interface MapData {
  tiles: Tile[][]
}

export type LevelData = {
  level: number
  expRequired: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'
export type Vector = { dx: number; dy: number }

export enum ItemType {
  ITEM = 'item',
  WEAPON = 'weapon',
  ARMOR = 'armor',
  FOOD = 'food',
  CONSUMABLE = 'consumable',
}

type BaseItem = {
  id: string
  type: ItemType
  label: string
  description: string
  quantity?: number
}

// 일반 아이템 (퀘스트용, 재료 등)
export type GenericItem = BaseItem & {
  type: ItemType.ITEM
}

// 무기
export type WeaponItem = BaseItem & {
  type: ItemType.WEAPON
  atk: number
  crit: number
}

// 방어구
export type ArmorItem = BaseItem & {
  type: ItemType.ARMOR
  def: number
  evasion: number
}

// 음식
export type FoodItem = BaseItem & {
  type: ItemType.FOOD
  healAmount: number
}

// 소비 아이템 (포션 등)
export type ConsumableItem = BaseItem & {
  type: ItemType.CONSUMABLE
  healAmount: number
  // 필요하면 버프, 지속 효과 등 추가 가능
}

export type Item = GenericItem | WeaponItem | ArmorItem | FoodItem | ConsumableItem

export type Drop = {
  x: number
  y: number
  atk: number[]
  def: number[]
  crit: number[]
  evasion: number[]
} & Item

export type Corpse = {
  x?: number
  y?: number
} & BattleTarget

export type LootBag = {
  id: string
  x: number
  y: number
  exp: number
}

export interface GameContext {
  map: MapManager
  npcs: NPCManager
  world: World
  events: EventSystem
  drop: DropSystem
  save: any
  rl: any

  pendingAction?: (input: string) => void // 특수 프롬프트 응답 처리용 콜백
}

export type CommandFunction = (player: Player, args: string[], context: GameContext) => boolean | string

export interface NPC extends BattleTarget {
  id: string
  faction: string
  reborn: boolean
  lines: string[]
  deathLine: string
  isHostile: boolean
  noEscape?: boolean
}

export const SKILL_IDS = {
  RAISE_SKELETON: 'RAISE_SKELETON',
  CORPSE_EXPLOSION: 'CORPSE_EXPLOSION',
  SOUL_HARVEST: 'SOUL_HARVEST',
} as const;

// 2. 위 객체의 값들만 모아서 타입으로 추출
export type SkillId = typeof SKILL_IDS[keyof typeof SKILL_IDS];

// 3. 스킬 인터페이스 정의
export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  cost: number;
  execute: (player: Player, context: GameContext, args: string[]) => void;
}