import { Item as ItemClass } from '~/core/item/Item'
import { AttackType } from '~/core/types'

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC'
export enum ItemType {
  ITEM = 'item',
  WEAPON = 'weapon',
  ARMOR = 'armor',
  FOOD = 'food',
  CONSUMABLE = 'consumable',
  QUEST = 'quest',
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
  | 'ALONE'

export interface Affix {
  id: AffixId // 고유 식별자
  valueRange?: [number, number]
  value?: number
  metadata?: {
    needsConfirmOnUnequip?: boolean // 장비 해제 시 확인창 노출 여부 (기억 어픽스용)
    unEquipCaution?: string // 장비 해제 시 경고문
    [key: string]: any
  }
}

export type Item = ItemClass
export interface WeaponItem extends ItemClass {
  type: ItemType.WEAPON
  atk: number
  crit: number
  attackType: AttackType
  minRebornRarity?: number
  adjective?: string
  perfPrefix?: string
}

export interface ArmorItem extends ItemClass {
  type: ItemType.ARMOR
  def: number
  eva?: number
  minRebornRarity?: number
  adjective?: string
  perfPrefix?: string
}

export interface FoodItem extends ItemClass {
  type: ItemType.FOOD
  hpHeal: number
}

// 소비 아이템 (포션 등)
export interface ConsumableItem extends ItemClass {
  type: ItemType.CONSUMABLE
  hpHeal?: number
  mpHeal?: number
}

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
} & ItemClass
