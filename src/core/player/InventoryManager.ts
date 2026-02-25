import enquirer from 'enquirer'
import { ArmorItem, ConsumableItem, Item, ItemType, WeaponItem } from '~/types'
import { Player } from './Player'

export class InventoryManager {
  inventoryMax = 15
  inventory: Item[] = []

  constructor(private player: Player, saved?: Partial<Player>) {
    if (saved) {
      this.inventoryMax = saved.inventoryMax || 15
      this.inventory = saved.inventory || []
    }
  }

  async equip(newItem: Item) {
    const itemIndex = this.inventory.findIndex((i) => i.id === newItem.id)
    if (itemIndex === -1) {
      console.log('❌ 인벤토리에 해당 아이템이 없습니다.')
      return false
    }

    const slotMap: Record<string, keyof typeof this.player.equipped> = {
      [ItemType.WEAPON]: 'weapon',
      [ItemType.ARMOR]: 'armor',
    }

    const slot = slotMap[newItem.type]
    if (!slot) {
      console.log('⚠️ 장착할 수 없는 아이템 타입입니다.')
      return false
    }

    const oldItem = this.player.equipped[slot]
    if (oldItem?.affix?.metadata?.needsConfirmOnUnequip) {
      const caution = oldItem.affix
      const warningMsg =
        caution.metadata?.unEquipCaution || `⚠️ [${caution.name}] 어픽스가 해제됩니다. 진행하시겠습니까?`

      const { proceed } = await enquirer.prompt<{ proceed: boolean }> ({
        type: 'confirm',
        name: 'proceed',
        message: warningMsg,
        initial: false,
      })

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

    this.player.updateSkeletonLimit()
    return true
  }

  unEquip(slot: keyof typeof this.player.equipped): boolean {
    const item = this.player.equipped[slot]
    if (!item) return false

    this.player.equipped[slot] = null
    this.inventory.push(item)
    this.player.updateSkeletonLimit()

    return true
  }

  addItem(newItem: Item) {
    const existing = this.inventory.find((i) => i.id === newItem.id)
    if (existing && existing.quantity && newItem.quantity) {
      existing.quantity += newItem.quantity
    } else {
      this.inventory.push({ ...newItem })
    }
  }

  removeItem(itemId: string, amount: number = 1): boolean {
    const itemIndex = this.inventory.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      console.log('❌ 인벤토리에 해당 아이템이 없습니다.')
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
      console.log('\n🎒 사용할 수 있는 소비 아이템이 없습니다.')
      return false
    }

    if (!targetItem) {
      const { itemId } = await enquirer.prompt<{ itemId: string }> ({
        type: 'select',
        name: 'itemId',
        message: '어떤 아이템을 사용하시겠습니까?',
        choices: [
          ...consumables.map((item) => ({
            name: item.id,
            message: `${item.label} (x${item.quantity || 1}) ${
              item.hpHeal ? ` [HP +${item.hpHeal}]` : ''
            }${item.mpHeal ? ` [MP +${item.mpHeal}]` : ''}`,
          })),
          { name: 'cancel', message: '🔙 취소' },
        ],
        format(value) {
          if (value === 'cancel') return '취소'
          const item = consumables.find((i) => i.id === value)

          return item ? item.label : value
        },
      })

      if (itemId === 'cancel') return false
      targetItem = consumables.find((i) => i.id === itemId)
    }

    if (!targetItem) {
      console.log('해당 아이템이 존재하지 않습니다..')
      return false
    }

    console.log(`\n [${targetItem.label}]을(를) 사용합니다...`)

    if (targetItem.hpHeal) {
      const beforeHp = this.player.hp
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + targetItem.hpHeal)
      const recovered = this.player.hp - beforeHp
      console.log(`❤️ 체력이 ${recovered} 회복되었습니다. (현재: ${this.player.hp}/${this.player.maxHp})`)
    }

    if (targetItem.mpHeal) {
      const beforeMp = this.player.mp
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + targetItem.mpHeal)
      const recovered = this.player.mp - beforeMp
      console.log(`🧪 마나가 ${recovered} 회복되었습니다. (현재: ${this.player.mp}/${this.player.maxMp})`)
    }

    this.removeItem(targetItem.id, 1)

    return true
  }
}
