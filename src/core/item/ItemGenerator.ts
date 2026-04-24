
import { IGameItemFactory, IGenerationPolicy, IItemGenerator } from '../types/item'
import { generateId } from '../utils'
import { Item } from './Item'

export class ItemGenerator<TRarity = string, TAffix = any, TDrop = any> implements IItemGenerator {
  constructor(
    private readonly policy: IGenerationPolicy<TRarity, TAffix, TDrop>,
    public itemFactory: IGameItemFactory
  ) {}

  public createItem<TItem = Item>(baseItem: TDrop): TItem {
    if (!this.policy.isEquippable(baseItem)) {
      return this.itemFactory.make(baseItem as any) as TItem
    }

    const rarity = this.policy.rollRarity(this.policy.getMinRarity(baseItem), this.policy.getMaxRarity(baseItem))
    const setting = this.policy.getSetting(rarity)

    const ranges = this.policy.getStatRanges(baseItem)
    const { finalStats, mainValue, mainRange } = this.policy.calculateBaseStats(ranges, setting.multiplier)

    const affix = setting.hasAffix ? this.policy.pickAffix(rarity) : undefined
    const perfPrefix = this.policy.getPerformancePrefix(mainValue, mainRange)
    const adjective = this.pickRandomAdjective(setting.adjectives)

    return this.itemFactory.make({
      ...baseItem, // 원본 데이터 복사
      ...finalStats,
      id: generateId(ranges.baseId),
      rarity: rarity,
      perfPrefix,
      adjective,
      affix: affix,
    }) as TItem
  }

  private pickRandomAdjective(adjectives: string[]): string {
    return adjectives.length > 0 && adjectives[0] !== ''
      ? adjectives[Math.floor(Math.random() * adjectives.length)]
      : ''
  }
}
