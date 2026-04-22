import { GameContext, Tile } from '~/core/types'
import { Necromancer } from '../job/necromancer/Necromancer'
import { b1Handlers } from './b1'
import { b3Handlers } from './b3'
import { b4Handlers } from './b4'
import { commonHandlers } from './common'

export type EventHandler = (tile: Tile, context: GameContext) => Promise<void> | void

// 모든 핸들러를 통합
export const allEventHandlers: Record<string, EventHandler> = {
  ...commonHandlers,
  ...b1Handlers,
  ...b3Handlers,
  ...b4Handlers,
}
