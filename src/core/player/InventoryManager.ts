import i18n from '~/i18n'
import { Item } from '../item/Item'
import { Terminal } from '../Terminal'
import { IConsumable, IEquipAble, IGameItemFactory } from '../types'
import { Player } from './Player'

export class InventoryManager {
  inventoryMax = 15
  inventory: Item[] = []

  constructor(
    private itemFactory: IGameItemFactory,
    private player: Player,
    private slotMapping: Record<string, string>,
    saved?: Partial<Player>
  ) {
    if (saved) {
      this.inventoryMax = saved.inventoryMax || 15
      this.inventory = (saved.inventory || []).map((item) => itemFactory.make(item))
    }
  }

  async equip(newItem: IEquipAble) {
    const itemIndex = this.inventory.findIndex((i) => i.id === newItem.id)
    if (itemIndex === -1) {
      Terminal.log({ key: 'inventory.remove.not_found' })
      return false
    }

    const slotName = this.slotMapping[newItem.type]
    if (!slotName) {
      Terminal.log({ key: 'inventory.equip.invalid_type' })
      return false
    }

    const equipped = this.player.equipped as Record<string, IEquipAble>
    const oldItem = equipped[slotName]

    // 해제 확인 로직 (기존과 동일)
    if (oldItem && oldItem.needsUnequipConfirm) {
      const proceed = await Terminal.confirm(oldItem.unequipWarning)
      if (!proceed) return false
    }

    equipped[slotName] = newItem

    const updatedInventory = this.inventory.filter((i) => i.id !== newItem.id)
    if (oldItem) {
      updatedInventory.push(this.itemFactory.make(oldItem))
    }

    this.inventory = updatedInventory
    this.player.onEquipmentChanged()

    return true
  }

  unEquip(slot: keyof typeof this.player.equipped): boolean {
    const item = this.player.equipped[slot]
    if (!item) return false

    this.player.equipped[slot] = null
    this.inventory.push(this.itemFactory.make(item))
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
      this.inventory.push(this.itemFactory.make(newItem.raw))
    }
  }

  removeItem(itemId: string, amount: number = 1): Item | void {
    const itemIndex = this.inventory.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      Terminal.log(i18n.t('inventory.remove.not_found'))
      return
    }

    const targetItem = this.inventory[itemIndex]

    if (!targetItem.quantity || amount === -1) {
      this.inventory.splice(itemIndex, 1)
      return this.itemFactory.make({ ...targetItem.raw, quantity: 1 })
    }

    if (targetItem.quantity > amount) {
      targetItem.quantity -= amount
    } else {
      this.inventory.splice(itemIndex, 1)
    }

    return this.itemFactory.make({ ...targetItem.raw, quantity: 1 })
  }

  async useItem(targetItem?: IConsumable) {
    const consumables = this.inventory.filter((item): item is IConsumable => (item as IConsumable).isConsumable)

    if (consumables.length === 0) {
      Terminal.log(i18n.t('inventory.use.no_consumables'))
      return false
    }

    if (!targetItem) {
      const choices = [
        ...consumables.map((item) => ({
          name: item.id,
          message: `${item.name} (x${item.quantity || 1})${item.hpHeal ? ` [HP +${item.hpHeal}]` : ''}${
            item.mpHeal ? ` [MP +${item.mpHeal}]` : ''
          }${item.exp ? ` [${i18n.t('inventory.exp')} +${item.exp}]` : ''}`,
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

    const gameItem = targetItem instanceof Item ? targetItem : this.itemFactory.make(targetItem)
    Terminal.log(i18n.t('inventory.use.using', { name: gameItem.name }))

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

    if (targetItem.exp) {
      this.player.gainExp(targetItem.exp)

      Terminal.log(
        i18n.t('inventory.use.exp_charged', {
          amount: targetItem.exp,
          current: this.player.exp,
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
