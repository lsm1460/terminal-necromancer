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
    maxSkeletonRange?: [number, number]
    baseId: string
  }

  getSetting(rarity: TRarity): {
    multiplier: number
    hasAffix: boolean
    adjectives: string[]
  }

  pickAffix(rarity: TRarity): TAffix
  getPerformancePrefix(value: number, range: [number, number]): string
}
