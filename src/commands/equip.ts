import enquirer from 'enquirer'
import { CommandFunction, ItemType } from '../types'

export const equipCommand: CommandFunction = async (player, args, context) => {
  const inventory = player.inventory

  const equipAbles = inventory.filter((_item) => [ItemType.WEAPON, ItemType.ARMOR].includes(_item.type))

  if (equipAbles.length < 1) {
    console.log('장비할 아이템이 없습니다.')
    return false
  }

  const findItem = (_itemId: string) => equipAbles.find((i) => i.id === _itemId)

  const choices = [
    ...equipAbles.map((item) => {
      let message = ''

      if (item.type === ItemType.WEAPON) {
        message = `${item.label} (atk: ${item.atk}, crit: ${Number(item.crit.toFixed(2)) * 100}%)`
      } else if (item.type === ItemType.ARMOR) {
        message = `${item.label} (def: ${item.def})`
      }

      return {
        name: item.id,
        message,
      }
    }),
    { name: 'cancel', message: '취소' },
  ]

  const { itemId } = (await enquirer.prompt({
    type: 'select',
    name: 'itemId',
    message: '장비할 아이템을 선택하세요:',
    choices,
    format(value) {
      if (value === 'cancel') return '취소'

      const item = findItem(value)
      return item ? item.label : value
    },
  })) as { itemId: string }

  // 3. 선택 결과 처리
  if (itemId === 'cancel') {
    return false
  }

  // 4. 아이템 탐색 및 장착 로직 실행
  const targetItem = findItem(itemId)

  if (targetItem) {
    console.log(`\n✨ [${targetItem.label}]을(를) 장비하였습니다.`)
    await player.equip(targetItem)
  }

  return false
}