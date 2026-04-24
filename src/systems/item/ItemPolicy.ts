import { IGenerationPolicy } from '~/core/types'
import { rollFromRange } from '~/core/utils'
import { Affix, GameDrop, ItemRarity, ItemType } from '~/types/item'
import { getAffixList } from '../affixes'
import { RARITY_SETTINGS } from './consts'

export class ItemPolicy implements IGenerationPolicy<ItemRarity, Affix, GameDrop> {
  isEquippable(baseItem: GameDrop): boolean {
    return [ItemType.WEAPON, ItemType.ARMOR].includes(baseItem.type as ItemType)
  }

  getMinRarity(baseItem: GameDrop): ItemRarity | undefined {
    return baseItem.minRarity
  }

  getMaxRarity(baseItem: GameDrop): ItemRarity | undefined {
    return baseItem.maxRarity
  }

  getStatRanges(baseItem: GameDrop) {
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

  calculateBaseStats(
    ranges: ReturnType<IGenerationPolicy<ItemRarity, Affix, GameDrop>['getStatRanges']>,
    multiplier: number
  ) {
    let finalStats: any = {}
    let mainValue = 0
    let mainRange: [number, number] = [0, 0]

    if (ranges.atkRange) {
      mainRange = ranges.atkRange
      mainValue = rollFromRange(mainRange, true)
      finalStats.atk = Math.floor(mainValue * multiplier)
      if (ranges.critRange) finalStats.crit = rollFromRange(ranges.critRange)
    } else if (ranges.defRange) {
      mainRange = ranges.defRange
      mainValue = rollFromRange(mainRange)
      finalStats.def = Math.floor(mainValue * multiplier)
      if (ranges.evaRange) finalStats.eva = rollFromRange(ranges.evaRange)
    }

    if (ranges.maxSkeletonRange) {
      finalStats.maxSkeleton = rollFromRange(ranges.maxSkeletonRange, true)
    }

    return { finalStats, mainValue, mainRange }
  }
}
