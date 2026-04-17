import i18n from '~/i18n'
import { AttackType } from '~/types'
import { Affix, ItemType } from '~/types/item'
import { getOriginId } from '~/utils'
import { Player } from '../player/Player'
import { ItemRarity, RARITY_SETTINGS } from './consts'

export class Item {
  id!: string
  type!: ItemType
  quantity?: number
  price!: number
  sellPrice!: number

  // Common options (Food, Consumables, etc)
  hpHeal?: number
  mpHeal?: number

  // Weapon specific
  atk?: number
  crit?: number
  attackType?: AttackType

  // Armor specific
  def?: number
  eva?: number

  // Shared Dynamic Props
  hp?: number
  mp?: number
  minRebornRarity?: number
  adjective?: string
  perfPrefix?: string
  maxSkeleton?: number
  affix?: Affix
  rarity?: ItemRarity

  // drop
  x?: number
  y?: number

  constructor(data: Partial<Item>, ) {
    Object.assign(this, data)
  }

  get origin() {
    const originId = getOriginId(this.id)
    return i18n.t(`item.${originId}.label`)
  }

  get name() {
    const finalLabel = []

    if (this.rarity) {
      const setting = RARITY_SETTINGS[this.rarity]

      finalLabel.push(setting.color)
      finalLabel.push(setting.symbol)
    }

    if ('affix' in this && this.affix) {
      const affixName = i18n.t(`affix.${this.affix.id}.name`)

      finalLabel.push(`[${affixName}]`)
    }

    if ('adjective' in this && this.adjective) {
      finalLabel.push(i18n.t(`item.prefix.${this.adjective}`))
    }

    if ('perfPrefix' in this && this.perfPrefix) {
      finalLabel.push(i18n.t(`item.prefix.${this.perfPrefix}`))
    }

    finalLabel.push(this.origin)
    finalLabel.push('\x1b[0m')

    return finalLabel.join(' ').replace(/\s+/g, ' ').trim()
  }

  get description() {
    const originId = getOriginId(this.id)
    return i18n.t(`item.${originId}.description`)
  }

  static makeItemMessage(item: Item, player: Player, options?: { withPrice?: boolean; isSell?: boolean }) {
    const typeLabel = i18n.t(`item.type.${item.type}`, { defaultValue: i18n.t('item.type.default') })

    let message = `[${typeLabel}] ${item.name}${item.quantity ? ` (x ${item.quantity})` : ''}`

    if (options?.withPrice) {
      const displayPrice = options.isSell ? (item.sellPrice ?? 0) : item.price
      message += ` (${displayPrice}gold)`
    }

    if (item.type === ItemType.WEAPON || item.type === ItemType.ARMOR) {
      const isWeapon = item.type === ItemType.WEAPON
      const currentVal = isWeapon ? player.equipped.weapon?.atk || 0 : player.equipped.armor?.def || 0
      const itemVal = isWeapon ? item.atk || 0 : item.def || 0

      const diff = itemVal - currentVal
      const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-'
      const statName = isWeapon ? i18n.t('stat.atk') : i18n.t('stat.def')

      // [ATK: 0 → 10 (▲10)] 형태
      message += ` [${statName}: ${currentVal} → ${itemVal} (${sign}${Math.abs(diff)})]`
    }

    return message
  }

  get raw() {
    return {
      id: this.id,
      type: this.type,
      price: this.price,
      sellPrice: this.sellPrice,
      quantity: this.quantity,

      ...(this.type === ItemType.WEAPON && {
        atk: this.atk || 0,
        crit: this.crit || 0,
        attackType: this.attackType,
      }),
      ...(this.type === ItemType.ARMOR && {
        def: this.def || 0,
        eva: this.eva || 0,
      }),
      ...([ItemType.WEAPON, ItemType.ARMOR].includes(this.type) && {
        rarity: this.rarity,
        perfPrefix: this.perfPrefix,
        adjective: this.adjective,

        ...(this.minRebornRarity ? { minRebornRarity: this.minRebornRarity } : {}),
        ...(this.maxSkeleton ? { maxSkeleton: this.maxSkeleton } : {}),
        ...(this.affix ? { affix: this.affix } : {}),
        ...(this.hp ? { hp: this.hp } : {}),
        ...(this.mp ? { mp: this.mp } : {}),
      }),

      ...([ItemType.CONSUMABLE, ItemType.FOOD].includes(this.type) && {
        ...(this.hpHeal ? { hpHeal: this.hpHeal } : {}),
        ...(this.mpHeal ? { mpHeal: this.mpHeal } : {}),
      }),
    }
  }
}
