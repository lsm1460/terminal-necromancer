import { Battle } from "../core/Battle"
import { LootFactory } from "../core/LootFactory"
import { BattleTarget, CommandFunction, Drop } from "../types"

// --- 공격 함수 ---
export const attackCommand: CommandFunction = (player, args, context) => {
  const { map } = context
  const { x, y } = player.pos

  const tile = map.getTile(x, y)
  let target: BattleTarget | null = null
  const monster = tile.currentMonster
  const npc = context.npcs.findNPC(tile.npcIds || [], args[0])

  if (npc) {
    target = npc
  }

  if (monster) {
    target = monster
  }

  if (!target) {
    console.log('공격할 대상이 없다.')
    return false
  }

  if (Battle.attack(player, target, context)) {
    const { gold, drops } = LootFactory.fromTarget(target, context.drop)

    player.gainExp(target.exp)
    player.gainGold(gold)

    let logMessage = `${target.name} 처치! EXP +${target.exp}`
    if (gold > 0) {
      logMessage += `, Gold +${gold}`
    }

    // 전투 결과 출력
    console.log(logMessage)

    drops.forEach((d) => {
      context.world.addDrop({ ...d, x, y } as Drop)
      const qtyText = d.quantity !== undefined ? ` ${d.quantity}개` : ''
      console.log(`${target.name}은(는) ${d.label}${qtyText}을(를) 떨구었다.`)
    })
  }

  return false
}