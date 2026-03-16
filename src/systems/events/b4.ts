import { sample, without } from 'lodash'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { relocateCaron } from '~/npc/caron'
import { Tile } from '~/types'
import { EventHandler } from '.'

export const b4Handlers: Record<string, EventHandler> = {
  'event-b4-warp': (tile, player, context) => {
    const { map } = context
    const tiles: (Tile | null)[][] = map.currentScene.tiles

    const safeTargets = tiles.flatMap((row, y) =>
      row
        .map((t, x) => (t ? { ...t, x, y } : null))
        .filter(
          (t): t is Tile & { x: number; y: number } =>
            !!t && t.event !== 'event-b4-warp' && !t.npcIds?.includes('caron')
        )
    )

    const target = sample(safeTargets)
    if (target) {
      player.x = target.x
      player.y = target.y

      Terminal.log(i18n.t('events.b4.warp.message'))
    }
  },
  'event-b4-reset': (tile, player, context) => {
    const { map, events, npcs } = context
    const isCaronEventFinished = events.isCompleted('caron_is_mine') || events.isCompleted('caron_is_dead')

    if (isCaronEventFinished) {
      const tiles = map.currentScene.tiles
      const defaultObserve = i18n.t('events.b4.reset.observe_default')

      tiles.forEach((row) => {
        row?.forEach((t) => {
          if (t) {
            t.npcIds = without(t.npcIds, 'caron')
            t.observe = defaultObserve
          }
        })
      })
    } else {
      const caron = npcs.getNPC('caron')
      relocateCaron(player, caron!, context)
    }
  },
}
