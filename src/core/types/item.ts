import { Item } from "../item/Item";

export interface IItemGenerator {
  createItem<TItem = Item>(baseItem: any): TItem;
}

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

export interface IDisplayable {
  readonly infoTags: string[]
}

export interface IEquipAble extends Item, IDisplayable {
  readonly isEquipAble: true
  readonly needsUnequipConfirm: boolean
  readonly unequipWarning: string
}

export interface IWeapon extends IEquipAble {
  atk: number
  crit: number
  attackType: string
}

export interface IArmor extends IEquipAble {
  def: number
  eva: number
}

export interface IConsumable extends Item, IDisplayable {
  hpHeal?: number
  mpHeal?: number
}

export interface IGameItemFactory {
  make<TItem = Item>(data: Partial<Item> | Drop): TItem
}
