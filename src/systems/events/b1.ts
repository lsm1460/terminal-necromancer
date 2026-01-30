import { EventHandler } from '.'
import { printLootStatus } from '../../statusPrinter'

export const b1Handlers: Record<string, EventHandler> = {
  'event-00': async (tile, player, context) => {
    context.events.completeEvent('START_GAME')
  },

  'event-01': async (tile, player, context) => {
    if (context.events.isCompleted('item-tutorial')) return

    const { x, y } = player.pos
    const { drops } = context.drop.generateDrops('tutorial_drop')

    drops.forEach((d) => context.world.addDrop({ ...d, x, y }))
    context.events.completeEvent('item-tutorial')
    printLootStatus(player, context)
  },
}
