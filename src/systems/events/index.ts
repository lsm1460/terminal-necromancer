import { commonHandlers } from './common'
import { GameContext, Tile } from '../../types'
import { Player } from '../../core/Player'
import { b1Handlers } from './b1'
import { b3Handlers } from './b3'

export type EventHandler = (tile: Tile, player: Player, context: GameContext) => Promise<void> | void

// 모든 핸들러를 통합
export const allEventHandlers: Record<string, EventHandler> = {
  ...commonHandlers,
  ...b1Handlers,
  ...b3Handlers,
}
