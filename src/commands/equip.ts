import { Logger } from '~/core/Logger'
import { CommandFunction, ItemType } from '~/types'
import { makeItemMessage } from '~/utils'

export const equipCommand: CommandFunction = async (player, args, context) => {
  const inventory = player.inventory

  const equipAbles = inventory.filter((_item) => [ItemType.WEAPON, ItemType.ARMOR].includes(_item.type))

  if (equipAbles.length < 1) {
    Logger.log('장비할 아이템이 없습니다.')
    return false
  }

  const findItem = (_itemId: string) => equipAbles.find((i) => i.id === _itemId)

  const choices = [
    ...equipAbles.map((item) => ({
      name: item.id,
      message: makeItemMessage(item, player),
    })),
    { name: 'cancel', message: '취소' },
  ]

  const itemId = await Logger.select('장비할 아이템을 선택하세요:', choices)

  // 3. 선택 결과 처리
  if (itemId === 'cancel') {
    return false
  }

  // 4. 아이템 탐색 및 장착 로직 실행
  const targetItem = findItem(itemId)

  if (targetItem) {
    Logger.log(`\n✨ [${targetItem.label}]을(를) 장비하였습니다.`)
    await player.equip(targetItem)
  }

  return false
}
