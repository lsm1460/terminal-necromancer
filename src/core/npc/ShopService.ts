import { ItemRarity } from '../item/consts'

export const ShopService = {
  /** 등급별 가격 배율 계산 */
  getRarityMultiplier(rarity?: ItemRarity): number {
    if (!rarity) {
      return 1
    }

    const multipliers: Record<ItemRarity, number> = {
      COMMON: 1.0,
      RARE: 1.5,
      EPIC: 2.5,
      // LEGENDARY: 4.0, // 추가 대비
    }

    return multipliers[rarity]
  },

  /** 구매 시 기여도 기반 할인율 계산 */
  calculateDiscountRate(contribution: number = 0): number {
    return Math.min(0.3, contribution * 0.001)
  },

  /** 판매 시 기여도 기반 보너스율 계산 */
  calculateSellBonusRate(contribution: number = 0): number {
    return Math.min(0.2, contribution * 0.0005)
  },
}
