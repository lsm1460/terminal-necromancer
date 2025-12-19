import { CommandFunction } from "../types"

// --- 장비 장착 (미구현) ---
export const equipCommand: CommandFunction = (player, args, context) => {
  // if (!player.equip(args[0])) console.log('장착할 아이템이 없다.')
  return false
}

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
        console.log(
          `- [무기] ${item.label}${qtyText} (공격력 +${item.atk}, 치명타 ${item.crit}%)`
        )
        break

      case 'armor':
        console.log(
          `- [방어구] ${item.label}${qtyText} (방어력 +${item.def}, 회피 ${item.evasion}%)`
        )
        break

      case 'food':
        console.log(
          `- [음식] ${item.label}${qtyText} (회복 +${item.healAmount})`
        )
        break

      default:
        console.log(
          `- [아이템] ${item.label}${qtyText}`
        )
        break
    }
  }

  return false
}

export const pickCommand: CommandFunction = (player, args, context) => {
  if (args.length < 1) {
    console.log('주울 아이템을 지정해야한다.')
    return false
  }

  const drops = context.world.getDropsAt(player.x, player.y)
  if (!drops.length) {
    console.log('주울 아이템이 없다.')
    return false
  }

  args.forEach((name) => {
    // 해당 이름을 가진 드랍 찾기
    const dropIndex = drops.findIndex(d => d.label === name)
    if (dropIndex === -1) {
      console.log(`${name} 아이템이 해당 위치에 없다.`)
      return
    }

    const drop = drops[dropIndex]
    // 플레이어 인벤토리에 추가
    player.addItem(drop)
    const qtyText = drop.quantity !== undefined ? ` ${drop.quantity}개` : ''

    console.log(`${name}${qtyText} 획득`)

    // 월드에서 드랍 제거
    context.world.removeDropById(drop.id)
  })

  return false
}