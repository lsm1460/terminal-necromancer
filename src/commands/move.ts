import { DIRECTIONS } from '../consts'
import { CommandFunction } from '../types'

// --- 공통 이동 함수 ---
export const moveCommand = (direction: keyof typeof DIRECTIONS): CommandFunction => {
  return (player, args, context) => {
    const { map, npcs } = context
    const { currentMonster: monster, npcIds } = map.getTile(player.pos.x, player.pos.y)

    const npc = (npcIds || [])
      .map((_id) => npcs.getNPC(_id))
      .filter((_npc) => _npc !== null)
      .find((item) => item.isHostile && item.noEscape)

    const target = monster || npc

    if (target?.noEscape) {
      console.log(target.name + '이(가) 주시하고 있어 도망칠 수 없다.')
      return false
    }

    const { dx, dy } = DIRECTIONS[direction]
    const { x, y } = player.pos

    if (map.canMove(x + dx, y + dy)) {
      player.move(dx, dy)
      return true
    }
    console.log('지나갈 수 없다.')
    return false
  }
}
