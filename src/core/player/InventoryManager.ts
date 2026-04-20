import i18n from '~/i18n'
import { getAffixCaution } from '~/systems/affixes'
import { ArmorItem, ConsumableItem, ItemType, WeaponItem } from '~/types/item'
import { Item } from '../item/Item'
import { Terminal } from '../Terminal'
import { Player } from './Player'

export class InventoryManager {
  inventoryMax = 15
  inventory: Item[] = []

  constructor(
    private player: Player,
    saved?: Partial<Player>
  ) {
    if (saved) {
      this.inventoryMax = saved.inventoryMax || 15
      this.inventory = (saved.inventory || []).map((item) => new Item(item))
    }
  }

  async equip(newItem: Item) {
    const itemIndex = this.inventory.findIndex((i) => i.id === newItem.id)
    if (itemIndex === -1) {
      Terminal.log(i18n.t('inventory.remove.not_found'))
      return false
    }

    const slotMap: Record<string, keyof typeof this.player.equipped> = {
      [ItemType.WEAPON]: 'weapon',
      [ItemType.ARMOR]: 'armor',
    }

    const slot = slotMap[newItem.type]
    if (!slot) {
      Terminal.log(i18n.t('inventory.equip.invalid_type'))
      return false
    }

    const oldItem = this.player.equipped[slot]
    if (oldItem?.affix?.metadata?.needsConfirmOnUnequip) {
      const caution = oldItem.affix
      const cautionAffixName = i18n.t(`affix.${caution.id}.name`)

      const warningMsg =
        getAffixCaution(caution.id) || i18n.t('inventory.equip.unequip_caution', { name: cautionAffixName })

      const proceed = await Terminal.confirm(warningMsg)
      if (!proceed) {
        return false
      }
    }

    if (slot === 'weapon') {
      this.player.equipped.weapon = newItem as WeaponItem
    } else if (slot === 'armor') {
      this.player.equipped.armor = newItem as ArmorItem
    }

    const updatedInventory = this.inventory.filter((i) => i.id !== newItem.id)
    if (oldItem) {
      updatedInventory.push(oldItem)
    }

    this.inventory = updatedInventory
    this.player.onEquipmentChanged()

    return true
  }

  unEquip(slot: keyof typeof this.player.equipped): boolean {
    const item = this.player.equipped[slot]
    if (!item) return false

    this.player.equipped[slot] = null
    this.inventory.push(item)
    this.player.onEquipmentChanged()

    return true
  }

  hasItem(id: string) {
    return !!this.inventory.find((i) => i.id === id)
  }

  addItem(newItem: Item) {
    const existing = this.inventory.find((i) => i.id === newItem.id)
    if (existing && existing.quantity && newItem.quantity) {
      existing.quantity += newItem.quantity
    } else {
      this.inventory.push(new Item(newItem.raw))
    }
  }

  removeItem(itemId: string, amount: number = 1): boolean {
    const itemIndex = this.inventory.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      Terminal.log(i18n.t('inventory.remove.not_found'))
      return false
    }

    const targetItem = this.inventory[itemIndex]

    if (!targetItem.quantity || amount === -1) {
      this.inventory.splice(itemIndex, 1)
      return true
    }

    if (targetItem.quantity > amount) {
      targetItem.quantity -= amount
    } else {
      this.inventory.splice(itemIndex, 1)
    }

    return true
  }

  async useItem(targetItem?: ConsumableItem) {
    const consumables = this.inventory.filter((item): item is ConsumableItem =>
      [ItemType.CONSUMABLE, ItemType.FOOD].includes(item.type)
    )

    if (consumables.length === 0) {
      Terminal.log(i18n.t('inventory.use.no_consumables'))
      return false
    }

    if (!targetItem) {
      const choices = [
        ...consumables.map((item) => ({
          name: item.id,
          message: `${item.name} (x${item.quantity || 1}) ${
            item.hpHeal ? ` [HP +${item.hpHeal}]` : ''
          }${item.mpHeal ? ` [MP +${item.mpHeal}]` : ''}`,
        })),
        { name: 'cancel', message: i18n.t('cancel') },
      ]

      const itemId = await Terminal.select(i18n.t('inventory.use.select_prompt'), choices)

      if (itemId === 'cancel') return false
      targetItem = consumables.find((i) => i.id === itemId)
    }

    if (!targetItem) {
      Terminal.log(i18n.t('item_not_found'))
      return false
    }

    Terminal.log(i18n.t('inventory.use.using', { name: targetItem.name }))

    if (targetItem.hpHeal) {
      const recovered = this.player.recoverHp(targetItem.hpHeal)

      Terminal.log(
        i18n.t('inventory.use.hp_recovered', {
          amount: recovered,
          current: this.player.hp,
          max: this.player.maxHp,
        })
      )
    }

    // MP 회복 처리
    if (targetItem.mpHeal) {
      const recovered = this.player.recoverMp(targetItem.mpHeal)

      Terminal.log(
        i18n.t('inventory.use.mp_recovered', {
          amount: recovered,
          current: this.player.mp,
          max: this.player.maxMp,
        })
      )
    }

    this.removeItem(targetItem.id, 1)

    return true
  }

  public toJSON() {
    return {
      inventory: this.inventory.map((item) => item.raw),
      inventoryMax: this.inventoryMax,
    }
  }
}
