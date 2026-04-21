import { Item } from './Item'

export interface IGenerationPolicy<TRarity, TAffix, TDrop> {
  isEquippable(baseItem: TDrop): boolean

  getMinRarity(baseItem: TDrop): TRarity | undefined
  getMaxRarity(baseItem: TDrop): TRarity | undefined

  rollRarity(min?: TRarity, max?: TRarity): TRarity

  getStatRanges(baseItem: TDrop): {
    atkRange?: [number, number]
    defRange?: [number, number]
    critRange?: [number, number]
    evaRange?: [number, number]
    baseId: string
  } & Partial<TDrop>

  getSetting(rarity: TRarity): {
    multiplier: number
    hasAffix: boolean
    adjectives: string[]
  }

  pickAffix(rarity: TRarity): TAffix
  getPerformancePrefix(value: number, range: [number, number]): string

  calculateBaseStats(
    ranges: ReturnType<IGenerationPolicy<TRarity, TAffix, TDrop>['getStatRanges']>,
    multiplier: number
  ): {
    finalStats: any
    mainValue: number
    mainRange: [number, number]
  }
}

export interface Drop extends Item {
  baseId: string
  x: number
  y: number

  atkRange?: [number, number]
  defRange?: [number, number]
  critRange?: [number, number]
  evaRange?: [number, number]
}

export interface IGameItemFactory {
  make(data: Partial<Item> | Drop): Item
}
