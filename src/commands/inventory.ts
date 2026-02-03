import enquirer from 'enquirer'
import { CommandFunction, ConsumableItem, Drop, ItemType } from '../types'
import { makeItemMessage } from '../utils'
import { printItem } from './overview'

export const inventoryCommand: CommandFunction = async (player, args, context) => {
  const inventory = player.inventory

  if (inventory.length === 0) {
    console.log('\n🎒 인벤토리가 텅 비어 있습니다.')
    return false
  }

  // 1. 아이템 리스트 생성
  const itemChoices = inventory.map((_item) => ({
    name: _item.id,
    message: makeItemMessage(_item, player),
  }))

  itemChoices.push({ name: 'cancel', message: '↩ 닫기' })

  try {
    const { itemId } = await enquirer.prompt<{ itemId: string }>({
      type: 'select',
      name: 'itemId',
      message: '조회할 아이템을 선택하세요',
      choices: itemChoices,
      format(value) {
        const choice = itemChoices.find((c) => c.name === value)

        return choice?.message || ''
      },
    })

    if (itemId === 'cancel') return false

    // 2. 선택한 아이템 객체 조회
    const selectedItem = inventory.find((i) => i.id === itemId)
    if (!selectedItem) return false

    // 4. ItemType Enum에 따른 동적 액션 결정
    const actions: { name: string; message: string }[] = [{ name: 'look', message: '🔍 살펴보기' }]

    switch (selectedItem.type) {
      case ItemType.WEAPON:
      case ItemType.ARMOR:
        actions.push({ name: 'equip', message: '⚔️ 장착하기' })
        break
      case ItemType.FOOD:
      case ItemType.CONSUMABLE:
        actions.push({ name: 'use', message: '🧪 사용하기' })
        break
      case ItemType.ITEM:
        // 일반 아이템은 특수 액션 없음 (정보 확인용)
        break
    }

    actions.push({ name: 'drop', message: '🗑️ 버리기' })
    actions.push({ name: 'back', message: '↩ 뒤로 가기' })

    const { action } = await enquirer.prompt<{ action: string }>({
      type: 'select',
      name: 'action',
      message: `[${selectedItem.label}] 무엇을 하시겠습니까?`,
      choices: actions,
      format(value) {
        const choice = actions.find((c) => c.name === value)

        return choice?.message || ''
      },
    })

    // 5. 액션 처리
    switch (action) {
      case 'look':
        printItem(selectedItem)
        break
      case 'equip':
        console.log(`\n✨ [${selectedItem.label}]을(를) 장비하였습니다.`)
        await player.equip(selectedItem)
        break
      case 'use':
        await player.useItem(selectedItem as ConsumableItem)
        break
      case 'drop':
        // 플레이어 인벤토리에서 제거
        const isDrop = player.removeItem(selectedItem.id)

        if (isDrop) {
          // 월드 맵의 현재 좌표에 Drop 아이템으로 생성
          context.world.addDrop({
            ...selectedItem,
            quantity: 1,
            x: player.x,
            y: player.y,
          } as Drop)

          const qtyText = selectedItem.quantity !== undefined ? ` 1개` : ''
          console.log(`📦 [${selectedItem.label}]${qtyText}을(를) 바닥에 버렸습니다.`)
        }
        break
      case 'back':
        return await inventoryCommand(player, args, context)
    }
  } catch (error) {
    // 인터럽트 발생 시 처리
  }

  return false
}
