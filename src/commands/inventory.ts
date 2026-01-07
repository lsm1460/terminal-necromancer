import enquirer from 'enquirer'
import { CommandFunction, Drop, Item, ItemType } from '../types'

export const inventoryCommand: CommandFunction = (player, args, context) => {
  const inventory = player.inventory

  if (inventory.length === 0) {
    console.log('인벤토리가 비어 있습니다.')
    return false
  }

  console.log('📦 인벤토리 목록:')

  for (const item of inventory) {
    const qtyText = item.quantity !== undefined ? ` x${item.quantity}` : ''

    switch (item.type) {
      case 'weapon':
        console.log(`- [무기] ${item.label}${qtyText} (공격력 +${item.atk}, 치명타 ${item.crit}%)`)
        break

      case 'armor':
        console.log(`- [방어구] ${item.label}${qtyText} (방어력 +${item.def})`)
        break

      case 'food':
        console.log(`- [음식] ${item.label}${qtyText} (회복 +${item.hpHeal})`)
        break

      default:
        console.log(`- [아이템] ${item.label}${qtyText}`)
        break
    }
  }

  return false
}
