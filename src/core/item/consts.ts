export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC'
export type ItemType = 'weapon' | 'armor'

export interface RaritySetting {
  label: string
  multiplier: number
  weight: number
  hasAffix: boolean
  color: string
  symbol: string
  adjectives: string[]
}

export const RARITY_SETTINGS: Record<ItemRarity, RaritySetting> = {
  COMMON: {
    label: '일반',
    multiplier: 1.0,
    weight: 86,
    hasAffix: false,
    color: '\x1b[37m', // White
    symbol: '⚪',
    adjectives: [''],
  },
  RARE: {
    label: '희귀',
    multiplier: 1.25,
    weight: 10,
    hasAffix: false,
    color: '\x1b[34m', // Blue
    symbol: '🔵',
    adjectives: ['정교한', '우수한', '날카로운', '강화된', '숙련된'],
  },
  EPIC: {
    label: '영웅',
    multiplier: 1.6,
    weight: 4,
    hasAffix: true,
    color: '\x1b[35m', // Purple
    symbol: '🟣',
    adjectives: ['심연의', '몰락한', '금지된', '태고의', '필멸의'],
  },
}
