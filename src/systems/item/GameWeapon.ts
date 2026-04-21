import { IWeapon } from '~/core/item/types'
import { Player } from '~/core/player/Player'
import { AttackType } from '~/core/types'
import i18n from '~/i18n'
import { GameEquipAble } from './GameEquipAble'

export class GameWeapon extends GameEquipAble implements IWeapon {
  atk = 0
  crit = 0
  attackType: AttackType

  constructor(data: Partial<IWeapon>) {
    super(data)

    this.atk = data.atk || 0
    this.crit = data.crit || 0
    this.attackType = (data.attackType || 'melee') as AttackType
  }

  get infoTags() {
    const tags = []
    if (this.atk > 0) tags.push(i18n.t('commands.look.item.stats.atk', { val: this.atk }))
    if (this.crit > 0) tags.push(i18n.t('commands.look.item.stats.crit', { val: `${(this.crit * 100).toFixed(2)}%` }))
    return tags
  }

  makeItemMessage(player: Player, options?: { withPrice?: boolean; isSell?: boolean }) {
    const typeLabel = i18n.t(`item.type.${this.type}`, { defaultValue: i18n.t('item.type.default') })

    let message = `[${typeLabel}] ${this.name}${this.quantity ? ` (x ${this.quantity})` : ''}`

    if (options?.withPrice) {
      const displayPrice = options.isSell ? (this.sellPrice ?? 0) : this.price
      message += ` (${displayPrice}gold)`
    }

    const currentVal = player.equipped.weapon?.atk || 0
    const itemVal = this.atk || 0

    const diff = itemVal - currentVal
    const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-'
    const statName = i18n.t('stat.atk')

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

      atk: this.atk || 0,
      crit: this.crit || 0,
      attackType: this.attackType,
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
