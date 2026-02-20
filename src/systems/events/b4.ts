import { EventHandler } from '.'
import { relocateCaron } from '../../npc/caron'
import { Tile } from '../../types'
import _ from 'lodash'

export const b4Handlers: Record<string, EventHandler> = {
  'event-b4-warp': (tile, player, context) => {
    const { map } = context
    const tiles: Tile[][] = map.currentScene.tiles
    const targetEvent = 'event-b4-warp'

    const safeTargets = _.chain(tiles)
      .flatMap(
        (row, y) => row.map((t, x) => ({ ...(t || {}), x, y })) // 각 타일에 좌표 정보 주입
      )
      .filter((t) => t && t.event !== targetEvent && !t.npcIds?.includes('caron'))
      .value()

    if (safeTargets.length > 0) {
      const target = _.sample(safeTargets)

      if (target) {
        console.log('DEBUG::', target)
        player.x = target.x
        player.y = target.y

        console.log('공간이 거울처럼 조각나며 당신을 낯선 곳으로 내던집니다.')
      }
    }
  },
  'event-b4-reset': (tile, player, context) => {
    const { map, events, npcs } = context
    const isCaronEventFinished = events.isCompleted('caron_is_mine') || events.isCompleted('caron_is_dead')

    if (isCaronEventFinished) {
      const tiles = map.currentScene.tiles

      // 맵 전체를 돌며 observe 메시지를 기본값으로 초기화
      tiles.forEach((row) => {
        row?.forEach((t) => {
          if (t) {
            t.npcIds = _.without(t.npcIds, 'caron')
            t.observe = '...폐허뿐이 보이지 않습니다.'
          }
        })
      })
    } else {
      const caron = npcs.getNPC('caron')

      relocateCaron(player, caron!, context)
    }
  },
}
