export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC'
export type ItemType = 'weapon' | 'armor'

export interface RaritySetting {
  rarity: ItemRarity
  multiplier: number
  weight: number
  hasAffix: boolean
  color: string
  symbol: string
  adjectives: string[]
}

export const RARITY_SETTINGS: Record<ItemRarity, RaritySetting> = {
  COMMON: {
    rarity: 'COMMON',
    multiplier: 1.0,
    weight: 86,
    hasAffix: false,
    color: '\x1b[37m', // White
    symbol: '⚪',
    adjectives: [''],
  },
  RARE: {
    rarity: 'RARE',
    multiplier: 1.25,
    weight: 10,
    hasAffix: false,
    color: '\x1b[94m', // Blue
    symbol: '🔵',
    adjectives: ['exquisite', 'superior', 'keen', 'reinforced', 'seasoned'],
  },
  EPIC: {
    rarity: 'EPIC',
    multiplier: 1.6,
    weight: 4,
    hasAffix: true,
    color: '\x1b[35m', // Purple
    symbol: '🟣',
    adjectives: ['abyssal', 'fallen', 'forbidden', 'primal', 'mortal'],
  },
}
