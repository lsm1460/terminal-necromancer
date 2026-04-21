import { Drop } from '~/core/item/types'
import { printLootStatus } from '~/core/statusPrinter'
import { EventHandler } from '.'

export const b1Handlers: Record<string, EventHandler> = {
  'event-00': async (tile, context) => {
    context.events.completeEvent('START_GAME')
  },

  'event-01': async (tile, context) => {
    if (context.events.isCompleted('item-tutorial')) return

    const { drops } = context.drop.generateDrops('tutorial_drop')

    drops.forEach((d) => {
      context.world.addDrop(d as Drop)
    })

    context.events.completeEvent('item-tutorial')
    printLootStatus(context)

    // Terminal.log('')
  },
}
