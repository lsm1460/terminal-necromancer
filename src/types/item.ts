import { Drop as CoreDrop } from '~/core/item/types'
import { GameItem } from '~/systems/item/GameItem'

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

export type EquipAbleOptions = {
  affix?: Affix
  maxSkeleton?: number
  minRebornRarity?: number
  adjective?: string
  perfPrefix?: string
}

export interface GameDrop extends CoreDrop, GameItem {
  type: ItemType
  maxSkeletonRange?: [number, number]

  minRarity?: ItemRarity
  maxRarity?: ItemRarity

  rarity?: ItemRarity
}

export interface RaritySetting {
  rarity: ItemRarity
  multiplier: number
  weight: number
  hasAffix: boolean
  color: string
  symbol: string
  adjectives: string[]
}
