import { Item } from '~/core/item/Item'
import { IDisplayable } from '~/core/types'
import { Player } from '~/core/player/Player'
import { getOriginId } from '~/core/utils'
import i18n from '~/i18n'
import { ItemType } from '~/types/item'

export class GameItem extends Item {
  type: ItemType

  constructor(data: Partial<Item>) {
    super(data)

    this.type = data.type as ItemType
  }

  get origin() {
    const originId = getOriginId(this.id)
    return i18n.t(`item.${originId}.label`)
  }

  get name() {
    const finalLabel = []

    finalLabel.push(this.origin)
    finalLabel.push('\x1b[0m')

    return finalLabel.join(' ').replace(/\s+/g, ' ').trim()
  }

  get description() {
    const originId = getOriginId(this.id)
    return i18n.t(`item.${originId}.description`)
  }

  get infoTags(): IDisplayable['infoTags'] {
    return []
  }

  makeItemMessage(player: Player, options?: { withPrice?: boolean; isSell?: boolean }) {
    const typeLabel = i18n.t(`item.type.${this.type}`, { defaultValue: i18n.t('item.type.default') })

    let message = `[${typeLabel}] ${this.name}${this.quantity ? ` (x ${this.quantity})` : ''}`

    if (options?.withPrice) {
      const displayPrice = options.isSell ? (this.sellPrice ?? 0) : this.price
      message += ` (${displayPrice}gold)`
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
    } as Record<string, any>
  }
}
