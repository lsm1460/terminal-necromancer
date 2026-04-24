import { IConsumable } from '~/core/types'
import i18n from '~/i18n'
import { GameItem } from './GameItem'

export class GameConsumable extends GameItem implements IConsumable {
  hpHeal: number
  mpHeal: number

  constructor(data: Partial<IConsumable>) {
    super(data)

    this.hpHeal = data.hpHeal || 0
    this.mpHeal = data.mpHeal || 0
  }

  get infoTags() {
    const tags = []
    if (this.hpHeal > 0) tags.push(i18n.t('commands.look.item.stats.hpHeal', { val: `+${this.hpHeal}` }))
    if (this.mpHeal > 0) tags.push(i18n.t('commands.look.item.stats.mpHeal', { val: `+${this.mpHeal}` }))
    return tags
  }

  get raw() {
    return {
      id: this.id,
      type: this.type,
      price: this.price,
      sellPrice: this.sellPrice,
      quantity: this.quantity,
      ...(this.hpHeal ? { hpHeal: this.hpHeal } : {}),
      ...(this.mpHeal ? { mpHeal: this.mpHeal } : {}),
    } as Record<string, any>
  }
}
