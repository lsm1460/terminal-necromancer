import enquirer from 'enquirer'
import { CommandFunction, Drop, Item } from '../types'

export const dropCommand: CommandFunction = async (player, args, context) => {
  const inventory = player.inventory

  if (inventory.length === 0) {
    console.log('버릴 아이템이 없습니다.')
    return false
  }

  let itemToDrop: Item | undefined

  // 1. 인자(args)가 있는 경우: 이름으로 직접 찾기 (예: drop 포션)
  if (args.length > 0) {
    args.forEach((name) => {
      // 해당 이름을 가진 드랍 찾기
      const itemIndex = inventory.findIndex((d) => d.label === name)
      if (itemIndex === -1) {
        console.log(`${name} 아이템이 해당 위치에 없습니다.`)
        return
      }

      itemToDrop = inventory[itemIndex]
    })
  }
  // 2. 인자가 없는 경우: Enquirer 선택창 띄우기
  else {
    const { itemId } = (await enquirer.prompt({
      type: 'select',
      name: 'itemId',
      message: '어떤 아이템을 버리시겠습니까?',
      choices: [
        ...inventory.map((item) => ({
          name: item.id,
          message: `${item.label}${item.quantity ? ` (${item.quantity}개)` : ''}`,
        })),
        { name: 'cancel', message: '🔙 취소' },
      ],
      format(value) {
        if (value === 'cancel') return '취소'
        const target = inventory.find((i) => i.id === value)

        return target ? target.label : value
      },
    })) as { itemId: string }

    if (itemId === 'cancel') return false
    itemToDrop = inventory.find((i) => i.id === itemId)
  }

  // 3. 실제 버리기 로직 처리
  if (itemToDrop) {
    // 플레이어 인벤토리에서 제거
    player.removeItem(itemToDrop.id)

    // 월드 맵의 현재 좌표에 Drop 아이템으로 생성
    context.world.addDrop({
      ...itemToDrop,
      quantity: 1,
      x: player.x,
      y: player.y,
    } as Drop)

    const qtyText = itemToDrop.quantity !== undefined ? ` 1개` : ''
    console.log(`📦 [${itemToDrop.label}]${qtyText}을(를) 바닥에 버렸습니다.`)
  }

  return false
}
