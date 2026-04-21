import { IArmor } from '~/core/item/types'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameEquipAble } from './GameEquipAble'

export class GameAmor extends GameEquipAble implements IArmor {
  def = 0
  eva = 0

  constructor(data: Partial<IArmor>) {
    super(data)

    this.def = data.def || 0
    this.eva = data.eva || 0
  }

  get infoTags() {
    const tags = []
    if (this.def > 0) tags.push(i18n.t('commands.look.item.stats.def', { val: this.def }))
    if (this.eva > 0) tags.push(i18n.t('commands.look.item.stats.eva', { val: `${(this.eva * 100).toFixed(2)}%` }))
    return tags
  }

  makeItemMessage(player: Player, options?: { withPrice?: boolean; isSell?: boolean }) {
    const typeLabel = i18n.t(`item.type.${this.type}`, { defaultValue: i18n.t('item.type.default') })

    let message = `[${typeLabel}] ${this.name}${this.quantity ? ` (x ${this.quantity})` : ''}`

    if (options?.withPrice) {
      const displayPrice = options.isSell ? (this.sellPrice ?? 0) : this.price
      message += ` (${displayPrice}gold)`
    }

    const currentVal = player.equipped.armor?.def || 0
    const itemVal = this.def || 0

    const diff = itemVal - currentVal
    const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-'
    const statName = i18n.t('stat.def')

    message += ` [${statName}: ${currentVal} → ${itemVal} (${sign}${Math.abs(diff)})]`

    return message
  }

  get raw() {
    return {
      id: this.id,
      type: this.type,
      price: this.price,
      sellPrice: this.sellPrice,
      quantity: this.quantity,

      def: this.def || 0,
      eva: this.eva || 0,

      rarity: this.rarity,
      perfPrefix: this.perfPrefix,
      adjective: this.adjective,

      ...(this.minRebornRarity ? { minRebornRarity: this.minRebornRarity } : {}),
      ...(this.maxSkeleton ? { maxSkeleton: this.maxSkeleton } : {}),
      ...(this.affix ? { affix: this.affix } : {}),
      ...(this.hp ? { hp: this.hp } : {}),
      ...(this.mp ? { mp: this.mp } : {}),
    } as Record<string, any>
  }
}
