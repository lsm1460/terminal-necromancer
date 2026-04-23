import { compact, flatten, pullAt, random, remove, shuffle } from 'lodash'
import { MAP_IDS, MapId } from '~/consts'
import { EventBus } from '~/core/EventBus'
import { Terminal } from '~/core'
import { assetManager } from '~/core/WebAssetManager'
import { BaseMapManager } from '~/core/map/BaseMapManager'
import { MapData } from '~/core/map/MapData'
import { printTileStatus } from '~/core/statusPrinter'
import { GameEventType, Tile } from '~/core/types'
import i18n from '~/i18n'
import { allEventHandlers } from '~/systems/events'
import { AppContext } from './types'

export class MapManager extends BaseMapManager<AppContext> {
  constructor(
    data: MapData,
    private eventBus: EventBus
  ) {
    super(data, MAP_IDS.B1_SUBWAY)
  }

  public override async changeScene(targetSceneId: MapId, context: AppContext) {
    const { player, currentTile, eventBus, npcs } = context
    const newScene = this.data.getScene(targetSceneId)

    if (!newScene) return

    if (!this.isFixedArea(targetSceneId)) {
      this.shuffleTiles(targetSceneId)
    }
    
    await assetManager.loadSceneAssets(newScene)
    
    await super.changeScene(targetSceneId, { player })

    Terminal.log(`\n------------------------------------------`)
    Terminal.log(i18n.t(`enter_new_area`) + i18n.t(`scene.${newScene.id}`))
    Terminal.log(`------------------------------------------`)

    await this.handleTileEvent(currentTile, context)

    eventBus.emitAsync(GameEventType.PLAYER_MOVE, { npcs })
    
    printTileStatus(context)
  }

  async handleTileEvent(tile: Tile, context: AppContext) {
    const handler = allEventHandlers[tile.event]
    if (handler) await handler(tile, context)

    if (tile.event.startsWith('monster-')) {
      await this.eventBus.emitAsync(GameEventType.SPAWN_MONSTER, {
        tile,
        isPassMonster: context.cheats.playerIsHide,
      })
    }

    tile.isSeen = true
    if (!(tile.event === 'boss' || tile.event.startsWith('monster') || tile.event.endsWith('-once'))) {
      tile.isClear = true
    }
  }

  private shuffleTiles(sceneId: string) {
    const scene = this.data.getOriginScene(sceneId)
    const { width, height } = { width: scene.tiles[0].length, height: scene.tiles.length }
    const start = scene.start_pos

    let allTiles = compact(flatten(scene.tiles))
    const startTile = scene.tiles[start.y][start.x]
    const bossTile = remove(allTiles, (t) => t.event === 'boss')[0]
    remove(allTiles, (t) => t === startTile)

    allTiles = shuffle(allTiles)

    const newGrid: (Tile | undefined)[][] = Array.from({ length: height }, () => Array(width).fill(undefined))
    newGrid[start.y][start.x] = startTile

    const candidates: string[] = []
    const updateCandidates = (cx: number, cy: number) => {
      const neighbors = [
        { x: cx + 1, y: cy },
        { x: cx - 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy - 1 },
      ].filter((p) => p.x >= 0 && p.x < width && p.y >= 0 && p.y < height)
      neighbors.forEach((p) => {
        const key = `${p.x},${p.y}`
        if (!newGrid[p.y][p.x] && !candidates.includes(key)) candidates.push(key)
      })
    }

    updateCandidates(start.x, start.y)
    const minBossDist = Math.floor((width + height) / 2)
    let bossPlaced = !bossTile

    while (candidates.length > 0) {
      const randomIndex = random(0, candidates.length - 1)
      const [cx, cy] = pullAt(candidates, randomIndex)[0].split(',').map(Number)
      const dist = Math.abs(cx - start.x) + Math.abs(cy - start.y)

      if (!bossPlaced && bossTile && (dist >= minBossDist || allTiles.length === 0)) {
        newGrid[cy][cx] = bossTile
        bossPlaced = true
        updateCandidates(cx, cy)
      } else if (allTiles.length > 0) {
        newGrid[cy][cx] = allTiles.pop()
        updateCandidates(cx, cy)
      }
    }

    this.data.updateTiles(sceneId, newGrid as Tile[][])
  }

  private isFixedArea(id: MapId): boolean {
    return ([MAP_IDS.B1_SUBWAY, MAP_IDS.B3_5_RESISTANCE_BASE, MAP_IDS.B4_Waste_Disposal_Area] as MapId[]).includes(id)
  }
}
