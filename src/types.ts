import { MapManager } from "./core/MapManager"
import { Player } from "./core/Player"
import { World } from "./core/World"
import { EventSystem } from "./systems/EventSystem"

export interface Monster {
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
  drops: Item[]
}

export interface Tile {
  theme: string
  event: string
  dialogue: string
  currentMonster?: Monster
  encounterRate?: number
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
} & Item

export type LootBag = {
  id: string
  x: number
  y: number
  drops: Item[]
}

export interface GameContext {
  map: MapManager
  world: World
  events: EventSystem
  save: any
  rl: any
}

export type CommandFunction = (player: Player, args: string[], context: GameContext) => boolean | string