import { Item } from '~/core/item/Item'
import { Player } from '~/core/player/Player'
import { getOriginId } from '~/core/utils'
import i18n from '~/i18n'
import { Affix, ItemRarity, ItemType } from '~/types/item'
import { RARITY_SETTINGS } from './GameItemFactory'

export class GameItem extends Item {
  minRebornRarity?: number
  adjective?: string
  perfPrefix?: string
  maxSkeleton?: number
  affix?: Affix
  declare rarity?: ItemRarity

  constructor(
    data: Partial<Item> & {
      perfPrefix?: string
      adjective?: string
      affix?: Affix
    }
  ) {
    super(data)

    this.affix = data.affix
    this.perfPrefix = data.perfPrefix
    this.adjective = data.adjective
  }

  get origin() {
    const originId = getOriginId(this.id)
    return i18n.t(`item.${originId}.label`)
  }

  get name() {
    const finalLabel = []

    if (this.rarity) {
      const setting = RARITY_SETTINGS[this.rarity]
      if (setting) {
        finalLabel.push(setting.color)
        finalLabel.push(setting.symbol)
      }
    }

    if (this.affix) {
      const affixName = i18n.t(`affix.${this.affix.id}.name`)
      finalLabel.push(`[${affixName}]`)
    }

    if (this.adjective) {
      finalLabel.push(i18n.t(`item.prefix.${this.adjective}`))
    }

    if (this.perfPrefix) {
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

  makeItemMessage(player: Player, options?: { withPrice?: boolean; isSell?: boolean }) {
    const typeLabel = i18n.t(`item.type.${this.type}`, { defaultValue: i18n.t('item.type.default') })

    let message = `[${typeLabel}] ${this.name}${this.quantity ? ` (x ${this.quantity})` : ''}`

    if (options?.withPrice) {
      const displayPrice = options.isSell ? (this.sellPrice ?? 0) : this.price
      message += ` (${displayPrice}gold)`
    }

    if (this.type === ItemType.WEAPON || this.type === ItemType.ARMOR) {
      const isWeapon = this.type === ItemType.WEAPON
      const currentVal = isWeapon ? player.equipped.weapon?.atk || 0 : player.equipped.armor?.def || 0
      const itemVal = isWeapon ? this.atk || 0 : this.def || 0

      const diff = itemVal - currentVal
      const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-'
      const statName = isWeapon ? i18n.t('stat.atk') : i18n.t('stat.def')

      message += ` [${statName}: ${currentVal} → ${itemVal} (${sign}${Math.abs(diff)})]`
    }

    return message
  }

  get raw() {
    const isWeapon = this.type === 'weapon'
    const isArmor = this.type === 'armor'
    const isConsumable = this.type === 'consumable'
    const isFood = this.type === 'food'

    return {
      id: this.id,
      type: this.type,
      price: this.price,
      sellPrice: this.sellPrice,
      quantity: this.quantity,

      ...(isWeapon && {
        atk: this.atk || 0,
        crit: this.crit || 0,
        attackType: this.attackType,
      }),
      ...(isArmor && {
        def: this.def || 0,
        eva: this.eva || 0,
      }),
      ...((isWeapon || isArmor) && {
        rarity: this.rarity,
        perfPrefix: this.perfPrefix,
        adjective: this.adjective,

        ...(this.minRebornRarity ? { minRebornRarity: this.minRebornRarity } : {}),
        ...(this.maxSkeleton ? { maxSkeleton: this.maxSkeleton } : {}),
        ...(this.affix ? { affix: this.affix } : {}),
        ...(this.hp ? { hp: this.hp } : {}),
        ...(this.mp ? { mp: this.mp } : {}),
      }),

      ...((isConsumable || isFood) && {
        ...(this.hpHeal ? { hpHeal: this.hpHeal } : {}),
        ...(this.mpHeal ? { mpHeal: this.mpHeal } : {}),
      }),
    } as Record<string, any>
  }
}
