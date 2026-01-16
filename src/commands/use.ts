import { CommandFunction, ConsumableItem, ItemType } from '../types'

export const useCommand: CommandFunction = async (player, args, context) => {
  // 1. 소비 아이템만 필터링
  const consumables = player.inventory.filter((item): item is ConsumableItem => item.type === ItemType.CONSUMABLE)

  if (consumables.length === 0) {
    console.log('\n🎒 사용할 수 있는 소비 아이템이 없습니다.')
    return false
  }

  let targetItem: ConsumableItem | undefined

  // 2. 인자(args) 처리 (예: use 포션)
  if (args.length > 0) {
    const itemName = args[0]
    targetItem = consumables.find((item) => item.label === itemName)

    if (!targetItem) {
      console.log(`\n❓ 인벤토리에 "${itemName}" 아이템이 없습니다.`)
      return false
    }
  }

  await player.useItem(targetItem)

  return false
}
