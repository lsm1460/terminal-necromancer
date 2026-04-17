import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ItemGenerator } from '../item/ItemGenerator'
import { ItemType } from '~/types'
import { ItemRarity } from '../item/consts'
import { Item } from '../item/Item'

// Mock dependencies
vi.mock('~/utils', () => ({
  generateId: vi.fn((id) => `${id}_mocked`),
}))

vi.mock('~/i18n', () => ({
  default: {
    t: vi.fn((key) => key),
  },
}))

vi.mock('../affixes', () => ({
  getAffixList: vi.fn(() => ({
    TEST_AFFIX: {
      id: 'TEST_AFFIX',
      valueRange: [10, 20],
    },
  })),
}))

describe('ItemGenerator', () => {
  let generator: ItemGenerator

  beforeEach(() => {
    generator = new ItemGenerator()
    vi.clearAllMocks()
  })

  describe('createItem', () => {
    it('should return a basic item if type is not weapon or armor', () => {
      const baseItem: any = {
        id: 'potion',
        type: ItemType.FOOD,
        price: 100,
      }

      const item = generator.createItem(baseItem)

      expect(item).toBeInstanceOf(Item)
      expect(item.id).toBe('potion')
      expect(item.type).toBe(ItemType.FOOD)
    })

    it('should generate a weapon with random rarity and stats', () => {
      const baseItem: any = {
        id: 'sword',
        type: ItemType.WEAPON,
        atkRange: [10, 20],
        critRange: [0.05, 0.1],
        price: 1000,
      }

      const item = generator.createItem(baseItem)

      expect(item).toBeInstanceOf(Item)
      expect(item.id).toBe('sword_mocked')
      expect(item.type).toBe(ItemType.WEAPON)
      expect(item.atk).toBeGreaterThanOrEqual(10)
      expect(item.crit).toBeGreaterThanOrEqual(0.05)
      expect(item.rarity).toBeDefined()
    })

    it('should generate an armor with random rarity and stats', () => {
      const baseItem: any = {
        id: 'plate',
        type: ItemType.ARMOR,
        defRange: [5, 15],
        evaRange: [0.01, 0.05],
        price: 800,
      }

      const item = generator.createItem(baseItem)

      expect(item).toBeInstanceOf(Item)
      expect(item.id).toBe('plate_mocked')
      expect(item.type).toBe(ItemType.ARMOR)
      expect(item.def).toBeGreaterThanOrEqual(5)
      expect(item.eva).toBeGreaterThanOrEqual(0.01)
      expect(item.rarity).toBeDefined()
    })

    it('should respect minRarity and maxRarity', () => {
      const baseItem: any = {
        id: 'epic_sword',
        type: ItemType.WEAPON,
        atkRange: [100, 200],
        minRarity: 'EPIC' as ItemRarity,
        maxRarity: 'EPIC' as ItemRarity,
      }

      const item = generator.createItem(baseItem)

      expect(item.rarity).toBe('EPIC')
      expect(item.affix).toBeDefined()
      expect(item.affix?.id).toBe('TEST_AFFIX')
    })
  })

  describe('finalizeStat (private via createItem)', () => {
    it('should handle integer stats correctly', () => {
      const baseItem: any = {
        id: 'test_item',
        type: ItemType.WEAPON,
        atkRange: [10, 10], // Fixed value
        minRarity: 'COMMON',
        maxRarity: 'COMMON',
      }

      const item = generator.createItem(baseItem)
      expect(item.atk).toBe(10)
    })

    it('should handle decimal stats correctly', () => {
      const baseItem: any = {
        id: 'test_item',
        type: ItemType.WEAPON,
        atkRange: [10, 10],
        critRange: [0.5, 0.5], // Fixed decimal
        minRarity: 'COMMON',
        maxRarity: 'COMMON',
      }

      const item = generator.createItem(baseItem)
      expect(item.crit).toBe(0.5)
    })
  })

  describe('performance prefix', () => {
    it('should assign "masterwork" for high rolls', () => {
      // Mock Math.random to return high values for stats
      const spy = vi.spyOn(Math, 'random')
      // 1. rollRarity roll (common)
      // 2. atk roll (high)
      // 3. adjectives roll
      spy.mockReturnValueOnce(0.9) // rollRarity: > 20 => COMMON
      spy.mockReturnValueOnce(0.99) // finalizeStat (atk): high
      spy.mockReturnValueOnce(0) // adjectives

      const baseItem: any = {
        id: 'sword',
        type: ItemType.WEAPON,
        atkRange: [10, 20],
      }

      const item = generator.createItem(baseItem)
      expect(item.perfPrefix).toBe('masterwork')
      spy.mockRestore()
    })

    it('should assign "worn" for low rolls', () => {
      const spy = vi.spyOn(Math, 'random')
      spy.mockReturnValueOnce(0.9) // rollRarity: COMMON
      spy.mockReturnValueOnce(0.01) // finalizeStat (atk): low
      spy.mockReturnValueOnce(0) // adjectives

      const baseItem: any = {
        id: 'sword',
        type: ItemType.WEAPON,
        atkRange: [10, 20],
      }

      const item = generator.createItem(baseItem)
      expect(item.perfPrefix).toBe('worn')
      spy.mockRestore()
    })
  })
})
