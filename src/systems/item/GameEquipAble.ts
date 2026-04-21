import { IEquipAble } from '~/core/item/types'
import i18n from '~/i18n'
import { Affix, EquipAbleOptions, ItemRarity } from '~/types/item'
import { getAffixCaution } from '../affixes'
import { GameItem } from './GameItem'
import { RARITY_SETTINGS } from './consts'

export class GameEquipAble extends GameItem implements IEquipAble {
  isEquipAble = true as const
  minRebornRarity?: number
  adjective?: string
  perfPrefix?: string
  maxSkeleton?: number
  affix?: Affix
  declare rarity?: ItemRarity

  constructor(data: Partial<IEquipAble> & EquipAbleOptions) {
    super(data)

    this.maxSkeleton = data.maxSkeleton || 0
    this.affix = data.affix
    this.perfPrefix = data.perfPrefix
    this.adjective = data.adjective
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

  get needsUnequipConfirm(): boolean {
    return !!this.raw.affix?.metadata?.needsConfirmOnUnequip
  }

  get unequipWarning(): string {
    const affix = this.raw.affix
    if (!affix) return ''

    const cautionAffixName = i18n.t(`affix.${affix.id}.name`)

    return getAffixCaution(affix.id) || i18n.t('inventory.equip.unequip_caution', { name: cautionAffixName })
  }
}
