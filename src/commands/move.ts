import { DIRECTIONS } from "../consts"
import { CommandFunction } from "../types"

export // --- 공통 이동 함수 ---
const moveCommand = (direction: keyof typeof DIRECTIONS): CommandFunction => {
  return (player, args, context) => {
    const { map } = context
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