import { Battle } from "../core/Battle"
import { LootFactory } from "../core/LootFactory"
import { CommandFunction } from "../types"

// --- 공격 함수 ---
export const attackCommand: CommandFunction = (player, args, context) => {
  const { map } = context
  const { x, y } = player.pos
  const monster = map.tile(x, y).currentMonster

  if (!monster) {
    console.log('공격할 대상이 없다.')
    return false
  }

  if (Battle.attack(player, monster)) {
    const { gold, drops } = LootFactory.fromMonster(monster)

    player.gainExp(monster.exp)
    player.gainGold(gold)

    let logMessage = `${monster.name} 처치! EXP +${monster.exp}`
    if (gold > 0) {
      logMessage += `, Gold +${gold}`
    }

    // 전투 결과 출력
    console.log(logMessage)

    drops.forEach((d) => {
      context.world.addDrop({ ...d, x, y })
      const qtyText = d.quantity !== undefined ? ` ${d.quantity}개` : ''
      console.log(`${monster.name}은(는) ${d.label}${qtyText}을(를) 떨구었다.`)
    })

    map.tile(x, y).currentMonster = undefined
  }

  return false
}