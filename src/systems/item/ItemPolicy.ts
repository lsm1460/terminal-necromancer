import { RARITY_SETTINGS } from '~/core/item/consts'
import { IGenerationPolicy } from '~/core/item/types'
import { rollFromRange } from '~/core/utils'
import { Affix, Drop, ItemRarity, ItemType } from '~/types/item'
import { getAffixList } from '../affixes'

export class ItemPolicy implements IGenerationPolicy<ItemRarity, Affix, Drop> {
  isEquippable(baseItem: Drop): boolean {
    return [ItemType.WEAPON, ItemType.ARMOR].includes(baseItem.type)
  }

  getMinRarity(baseItem: Drop): ItemRarity | undefined {
    return baseItem.minRarity
  }

  getMaxRarity(baseItem: Drop): ItemRarity | undefined {
    return baseItem.maxRarity
  }

  getStatRanges(baseItem: Drop) {
    return {
      atkRange: baseItem.atkRange,
      defRange: baseItem.defRange,
      critRange: baseItem.critRange,
      evaRange: baseItem.evaRange,
      maxSkeletonRange: baseItem.maxSkeletonRange,
      baseId: baseItem.id,
    }
  }

  rollRarity(min: ItemRarity = 'COMMON', max: ItemRarity = 'EPIC'): ItemRarity {
    const roll = Math.random() * 100
    let rolled: ItemRarity

    if (roll < 3) rolled = 'EPIC'
    else if (roll < 20) rolled = 'RARE'
    else rolled = 'COMMON'

    const rarityOrder: Record<ItemRarity, number> = { COMMON: 0, RARE: 1, EPIC: 2 }

    let minIdx = rarityOrder[min] ?? 0
    let maxIdx = rarityOrder[max] ?? 2
    let rolledIdx = rarityOrder[rolled]

    if (rolledIdx < minIdx) return min
    if (rolledIdx > maxIdx) return max
    return rolled
  }

  getSetting(rarity: ItemRarity) {
    return RARITY_SETTINGS[rarity]
  }

  pickAffix(rarity: ItemRarity): Affix {
    const affixList = getAffixList()
    const keys = Object.keys(affixList)
    const randomKey = keys[Math.floor(Math.random() * keys.length)]
    const affixData = affixList[randomKey]

    const value = affixData.valueRange ? rollFromRange(affixData.valueRange, true) : undefined

    return { ...affixData, value }
  }

  getPerformancePrefix(value: number, range: [number, number]): string {
    const [min, max] = range
    const diff = max - min
    if (diff <= 0) return ''
    if (value >= max - diff * 0.15) return 'masterwork'
    if (value <= min + diff * 0.15) return 'worn'
    return ''
  }
}
