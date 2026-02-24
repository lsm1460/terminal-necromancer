import { DIRECTIONS } from '~/consts'
import { CommandFunction } from '~/types'

// --- 공통 이동 함수 ---
export const moveCommand = (direction: keyof typeof DIRECTIONS): CommandFunction => {
  return async (player, args, context) => {
    const { map, npcs } = context
    const { monsters, npcIds } = map.getTile(player.pos.x, player.pos.y)

    // 1. 길을 막고 있는 몬스터 찾기
    const blockingMonster = monsters?.find((m) => m.isAlive && m.noEscape)

    // 2. 길을 막고 있는 NPC 찾기 (적대적 + 살아있음 + 도망불가)
    const blockingNPC = (npcIds || [])
      .map((id) => npcs.getNPC(id))
      .find((npc) => npc && npc.isAlive && npc.isHostile && npc.noEscape)

    // 3. 둘 중 하나라도 존재하면 해당 타겟을 변수에 담기
    const target = blockingMonster || blockingNPC

    if (target) {
      console.log(`\n🚫 ${target.name}이(가) 주시하고 있어 도망칠 수 없다.`)
      return false
    }

    const { dx, dy } = DIRECTIONS[direction]
    const { x, y } = player.pos

    if (map.canMove(x + dx, y + dy)) {
      await context.broadcast.play()
      player.move(dx, dy)
      return true
    }
    
    console.log('지나갈 수 없다.')
    return false
  }
}
