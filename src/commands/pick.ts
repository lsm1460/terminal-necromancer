import enquirer from 'enquirer'
import { CommandFunction, Drop, Item, ItemType } from '../types'

export const pickCommand: CommandFunction = async (player, args, context) => {
  // 1. 현재 위치의 드랍 아이템 탐색
  const { x, y } = player.pos
  const tile = context.map.getTile(x, y)

  const lootBag = context.world.getLootBagAt(context.map.currentSceneId, tile.id)
  const drops = context.world.getDropsAt(player.x, player.y)

  if (!drops.length && !lootBag) {
    console.log('\n🕳️ 이곳에는 주울 수 있는 아이템이 없습니다.')
    return false
  }

  // 2. 현재 인벤토리 총 점유 수량 계산 (각 아이템의 quantity 합산)
  const currentTotalQuantity = player.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)

  // 3. 남은 공간 확인
  const availableSpace = player.inventoryMax - currentTotalQuantity

  if (availableSpace <= 0) {
    console.log(`\n🎒 인벤토리가 가득 찼습니다! (${currentTotalQuantity}/${player.inventoryMax})`)
    console.log('아이템을 버리거나 사용하여 공간을 확보하세요.')
    return false
  }

  let drop: any | undefined

  // 선택 메뉴 띄우기
  const findDrop = (_dropId: string) => drops.find((_drop) => _drop.id === _dropId)

  const choices = [
    ...(lootBag
      ? [
          {
            name: 'lootBag',
            message: `내가 흘린 영혼의 조각들..(영혼 조각: ${lootBag.exp}, 골드: ${lootBag.gold})`,
          },
        ]
      : []),
    ...drops.map((d) => ({
      name: d.id,
      message: `${d.label}${d.quantity ? ` (${d.quantity}개)` : ''}`,
    })),
    { name: 'cancel', message: '🔙 취소' },
  ]

  const { dropId } = await enquirer.prompt<{ dropId: string }>({
    type: 'select',
    name: 'dropId',
    message: `무엇을 획득하시겠습니까? (공간: ${availableSpace}칸 남음)`,
    choices,
    format(value) {
      if (value === 'cancel') return '취소'
      if (value === 'lootBag') return '영혼 조각'

      const target = findDrop(value)
      return target ? target.label : value
    },
  })

  if (dropId === 'cancel') return false
  if (dropId === 'lootBag' && lootBag) {
    console.log(`\n흩어져 있던 영혼의 조각(${lootBag.exp} EXP)과 낡은 금화(${lootBag.gold} G)를 수습합니다.`)
    console.log(`"죽음은 끝이 아니었으나, 그 고통만큼은 고스란히 손끝에 전해집니다."`)

    player.gainExp(lootBag.exp)
    player.gainGold(lootBag.gold)
    context.world.removeLootBag()

    return false
  }

  drop = findDrop(dropId)

  // 5. 획득 처리
  if (drop) {
    const totalDropQty = drop.quantity || 1

    // 획득 가능 수량 계산 (전체 수량과 남은 공간 중 작은 값)
    const pickQty = Math.min(totalDropQty, availableSpace)
    const remainQty = totalDropQty - pickQty

    // 플레이어 인벤토리에 추가 (부분 수량만 전달)
    player.addItem({
      ...drop,
      quantity: pickQty,
    })

    const qtyText = pickQty > 1 ? ` ${pickQty}개` : ''
    console.log(`\n✨ [${drop.label}]${qtyText} 획득!`)

    // 6. 월드 맵 데이터 업데이트
    if (remainQty > 0) {
      // 공간 부족으로 일부만 주운 경우: 바닥에 남은 수량 갱신
      drop.quantity = remainQty
      console.log(`⚠️ 인벤토리 공간이 부족하여 ${remainQty}개는 바닥에 남았습니다.`)
    } else {
      // 전부 다 주운 경우: 월드에서 제거
      context.world.removeDropById(drop.id)
    }
  }

  return false
}
