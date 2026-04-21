import { Player } from '../player/Player'

export abstract class Item {
  id!: string
  type!: string
  quantity?: number
  price!: number
  sellPrice!: number

  // Common options (Food, Consumables, etc)
  hpHeal?: number
  mpHeal?: number

  // Weapon specific
  atk?: number
  crit?: number
  attackType?: string

  // Armor specific
  def?: number
  eva?: number

  // Shared Dynamic Props
  hp?: number
  mp?: number

  rarity?: string

  constructor(data: Partial<Item>) {
    Object.assign(this, data)
  }

  abstract get origin(): string
  abstract get name(): string
  abstract get description(): string
  abstract makeItemMessage(
    player: Player,
    options?: {
      withPrice?: boolean
      isSell?: boolean
    }
  ): string
  abstract get raw(): Record<string, any>
}
