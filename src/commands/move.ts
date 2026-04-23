import { DIRECTIONS } from '~/consts'
import { Terminal } from '~/core/Terminal'
import { CommandFunction } from '~/core/types'
import i18n from '~/i18n'

export type MoveBlockerCheckFn = () => string | null
export type BeforeMoveCallback = () => void

export const createMoveCommand = (
  direction: keyof typeof DIRECTIONS,
  options?: {
    blockerCheck?: MoveBlockerCheckFn
    beforeMove?: BeforeMoveCallback
  }
): CommandFunction => {
  return async (args, context) => {
    const { player, map } = context

    if (options?.blockerCheck) {
      const blockerName = options.blockerCheck()
      if (blockerName) {
        Terminal.log(i18n.t('commands.move.cannot_escape', { name: blockerName }))
        return false
      }
    }

    const { dx, dy } = DIRECTIONS[direction]
    const { x, y } = player.pos
    const nextPos = { x: x + dx, y: y + dy }

    if (map.canMove(nextPos)) {
      if (options?.beforeMove) options.beforeMove()
      player.move(dx, dy)
      return true
    }

    Terminal.log('> ' + i18n.t('commands.move.you_cannot_pass'))
    return false
  }
}

export const moveCommand = (direction: keyof typeof DIRECTIONS) => createMoveCommand(direction)
