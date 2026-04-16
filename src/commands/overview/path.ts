import { MapManager } from '~/systems/MapManager'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { Tile } from '~/types'
import { selectTarget } from './utils'

export const printPath = (tile: Tile) => {
  Terminal.log(i18n.t(`tiles.${tile?.id}.observe`))
  if (!tile?.isClear && tile?.event) {
    const eventId = tile.event

    if (eventId.includes('boss')) {
      Terminal.log(i18n.t('commands.look.path.danger_boss'))
    } else if (eventId.startsWith('monster')) {
      Terminal.log(i18n.t('commands.look.path.warning_monster'))
    }
  }
}

export const lookPath = async (
  paths: {
    label: string
    tile: Tile | null
  }[]
) => {
  const subChoices = paths.map((p) => ({
    name: p.label,
    message: p.label,
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = paths.find((p) => p.label === selected)

    if (target && target.tile) {
      printPath(target.tile)
    }
  }

  return selected
}

const DIRECTION_OFFSETS: Record<string, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

export const getTileFromDirection = (player: Player, map: MapManager, direction: string) => {
  const { x: originX, y: originY } = player.pos

  const offset = DIRECTION_OFFSETS[direction]
  if (!offset) return null // 유효하지 않은 방향 예외 처리

  const x = originX + offset.dx
  const y = originY + offset.dy

  const tile = map.getTile({ x, y }) as Tile | null

  return tile
}
