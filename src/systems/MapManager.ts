import _ from 'lodash'
import { MAP_IDS, MapId } from '~/consts'
import { EventBus } from '~/core/EventBus'
import { MapContainer } from '~/core/MapContainer'
import { printTileStatus } from '~/core/statusPrinter'
import { Terminal } from '~/core/Terminal'
import { GameContext, GameEventType, IMapManager, PositionType, Tile } from '~/core/types'
import { assetManager } from '~/core/WebAssetManager'
import i18n from '~/i18n'
import { allEventHandlers } from '~/systems/events'
import { Necromancer } from './job/necromancer/Necromancer'

export class MapManager implements IMapManager {
  constructor(
    public readonly container: MapContainer,
    private eventBus: EventBus
  ) {}

  get currentSceneId() {
    return this.container.currentSceneId
  }

  set currentSceneId(_val) {
    this.container.currentSceneId = _val
  }

  get currentScene() {
    return this.container.currentScene
  }

  public getTile(pos: PositionType): Tile {
    return this.container.getTile(pos)
  }

  public canMove(pos: PositionType): boolean {
    return this.container.canMove(pos)
  }

  async changeScene(targetSceneId: MapId, context: GameContext<Necromancer>) {
    const { player, broadcast } = context
    const newScene = this.container.getMap(targetSceneId)

    if (!newScene) {
      console.error(`[오류] 존재하지 않는 씬입니다: ${targetSceneId}`)
      return
    }

    this.container.currentSceneId = targetSceneId
    await assetManager.loadSceneAssets(newScene)

    if (!this.isFixedArea(targetSceneId)) {
      this.shuffleTiles(targetSceneId)
    }

    const { x, y } = newScene.move_pos || newScene.start_pos
    player.x = x
    player.y = y

    Terminal.log(`\n------------------------------------------`)
    Terminal.log(i18n.t(`enter_new_area`) + i18n.t(`scene.${newScene.id}`))
    Terminal.log(`------------------------------------------`)

    const currentTile = this.getTile(player.pos)
    currentTile.isSeen = true

    await this.handleTileEvent(currentTile, context)
    broadcast.play()
    printTileStatus(context)
  }

  async handleTileEvent(tile: Tile, context: GameContext<Necromancer>) {
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
    const scene = this.container.getOriginScene(sceneId)
    const { width, height } = { width: scene.tiles[0].length, height: scene.tiles.length }
    const start = scene.start_pos

    let allTiles = _.compact(_.flatten(scene.tiles))
    const startTile = scene.tiles[start.y][start.x]
    const bossTile = _.remove(allTiles, (t) => t.event === 'boss')[0]
    _.remove(allTiles, (t) => t === startTile)

    allTiles = _.shuffle(allTiles)

    const newGrid: (Tile | undefined)[][] = Array.from({ length: height }, () => Array(width).fill(undefined))
    newGrid[start.y][start.x] = startTile

    const candidates: string[] = []
    const updateCandidates = (x: number, y: number) => {
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
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
      const randomIndex = _.random(0, candidates.length - 1)
      const [cx, cy] = _.pullAt(candidates, randomIndex)[0].split(',').map(Number)
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

    this.container.updateSceneTiles(sceneId, newGrid as Tile[][])
  }

  private isFixedArea(id: MapId): boolean {
    return ([MAP_IDS.B1_SUBWAY, MAP_IDS.B3_5_RESISTANCE_BASE, MAP_IDS.B4_Waste_Disposal_Area] as MapId[]).includes(id)
  }

  isUnlocked(mapId: string, completed: string[]) {
    return this.container.isUnlocked(mapId, completed)
  }

  getMap(sceneId: string) {
    return this.container.getMap(sceneId)
  }
}
