import { generateId, rollFromRange } from '../utils'
import { Item } from './Item'
import { IGenerationPolicy } from './types'

export class ItemGenerator<TRarity, TAffix, TDrop> {
  constructor(private readonly policy: IGenerationPolicy<TRarity, TAffix, TDrop>) {}

  public createItem(baseItem: TDrop): Item {
    if (!this.policy.isEquippable(baseItem)) {
      return new Item(baseItem as any)
    }

    const rarity = this.policy.rollRarity(this.policy.getMinRarity(baseItem), this.policy.getMaxRarity(baseItem))
    const setting = this.policy.getSetting(rarity)

    const ranges = this.policy.getStatRanges(baseItem)
    const { finalStats, mainValue, mainRange } = this.calculateBaseStats(ranges, setting.multiplier)

    const affix = setting.hasAffix ? this.policy.pickAffix(rarity) : undefined
    const perfPrefix = this.policy.getPerformancePrefix(mainValue, mainRange)
    const adjective = this.pickRandomAdjective(setting.adjectives)

    return new Item({
      ...baseItem, // 원본 데이터 복사
      ...finalStats,
      id: generateId(ranges.baseId),
      rarity: rarity,
      perfPrefix,
      adjective,
      affix: affix,
    })
  }

  private calculateBaseStats(
    ranges: ReturnType<IGenerationPolicy<TRarity, TAffix, TDrop>['getStatRanges']>,
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

  private pickRandomAdjective(adjectives: string[]): string {
    return adjectives.length > 0 && adjectives[0] !== ''
      ? adjectives[Math.floor(Math.random() * adjectives.length)]
      : ''
  }
}
