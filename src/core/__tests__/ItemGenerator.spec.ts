import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ItemType } from '~/types/item'
import { Item } from '../item/Item'
import { ItemGenerator } from '../item/ItemGenerator'
import { IGenerationPolicy } from '../item/types'
import * as utils from '../utils'

// Mock dependencies
vi.mock('../utils', () => ({
  generateId: vi.fn((id) => `${id}_mocked`),
  rollFromRange: vi.fn((range, isInt) => (isInt ? range[0] : range[0])),
}))

/**
 * 테스트를 위한 더미 정책 클래스
 * IGenerationPolicy 인터페이스를 구현하며, 생성 로직을 세부적으로 제어합니다.
 */
class DummyItemPolicy implements IGenerationPolicy<string, any, any> {
  isEquippable(baseItem: any): boolean {
    return ['weapon', 'armor'].includes(baseItem.type)
  }

  getMinRarity(baseItem: any): string | undefined {
    return baseItem.minRarity
  }

  getMaxRarity(baseItem: any): string | undefined {
    return baseItem.maxRarity
  }

  rollRarity(min?: string, max?: string): string {
    return min || 'COMMON'
  }

  getStatRanges(baseItem: any) {
    return {
      baseId: baseItem.id,
      atkRange: baseItem.atkRange,
      defRange: baseItem.defRange,
      critRange: baseItem.critRange,
      evaRange: baseItem.evaRange,
      maxSkeletonRange: baseItem.maxSkeletonRange,
    }
  }

  getSetting(rarity: string) {
    switch (rarity) {
      case 'EPIC':
        return { multiplier: 1.5, hasAffix: true, adjectives: ['legendary'] }
      case 'RARE':
        return { multiplier: 1.25, hasAffix: false, adjectives: ['rare'] }
      default:
        return { multiplier: 1.0, hasAffix: false, adjectives: [] }
    }
  }

  pickAffix(rarity: string) {
    return { id: `AFFIX_${rarity}`, value: 10 }
  }

  getPerformancePrefix(value: number, range: [number, number]): string {
    if (!range || range[0] === range[1]) return ''
    if (value >= range[1] * 0.9) return 'masterwork'
    if (value <= range[0] * 1.1) return 'worn'
    return ''
  }
}

describe('ItemGenerator (Refactored with Dummy Policy)', () => {
  let generator: ItemGenerator<string, any, any>
  let policy: DummyItemPolicy

  beforeEach(() => {
    policy = new DummyItemPolicy()
    generator = new ItemGenerator(policy)
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
        minRarity: 'EPIC',
        maxRarity: 'EPIC',
      }

      const item = generator.createItem(baseItem)

      expect(item.rarity).toBe('EPIC')
      expect(item.affix).toBeDefined()
      expect(item.affix?.id).toBe('AFFIX_EPIC')
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
      (utils.rollFromRange as any).mockImplementation((range: [number, number]) => range[1]);

      const baseItem: any = {
        id: 'sword',
        type: ItemType.WEAPON,
        atkRange: [10, 20],
      }

      const item = generator.createItem(baseItem)
      expect(item.perfPrefix).toBe('masterwork')
    })

    it('should assign "worn" for low rolls', () => {
      (utils.rollFromRange as any).mockImplementation((range: [number, number]) => range[0]);

      const baseItem: any = {
        id: 'sword',
        type: ItemType.WEAPON,
        atkRange: [10, 20],
      }

      const item = generator.createItem(baseItem)
      expect(item.perfPrefix).toBe('worn')
    })
  })
})
