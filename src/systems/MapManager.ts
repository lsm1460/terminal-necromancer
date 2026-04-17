import _ from 'lodash'
import { MAP_IDS, MapId } from '~/consts'
import i18n from '~/i18n'
import { printTileStatus } from '~/core/statusPrinter'
import { EventBus } from '~/core/EventBus'
import { allEventHandlers } from '~/systems/events'
import { GameContext, PositionType, SceneData, Tile } from '~/types'
import { GameEventType } from '~/types/event'
import { Terminal } from '../core/Terminal'
import { assetManager } from '../core/WebAssetManager'

export class MapManager {
  private originMapData: Record<string, SceneData>
  private mapData: Record<string, SceneData>
  public currentSceneId: MapId

  /**
   * @param mapData - 경로 문자열 대신 JSON 객체 데이터를 직접 받습니다.
   */
  constructor(
    mapData: any,
    private eventBus: EventBus
  ) {
    this.mapData = JSON.parse(JSON.stringify(mapData))
    this.originMapData = JSON.parse(JSON.stringify(mapData))

    this.currentSceneId = MAP_IDS.B1_SUBWAY
  }

  get currentScene(): SceneData {
    return this.mapData[this.currentSceneId]
  }

  getTile({ x, y }: PositionType): Tile {
    return this.currentScene.tiles?.[y]?.[x]
  }

  async handleTileEvent(tile: Tile, context: GameContext) {
    const handler = allEventHandlers[tile.event]

    if (handler) {
      await handler(tile, context)
    }

    if (tile.event.startsWith('monster-')) {
      await this.eventBus.emitAsync(GameEventType.SPAWN_MONSTER, tile)
    }

    tile.isSeen = true
    if (!(tile.event === 'boss' || tile.event.startsWith('monster') || tile.event.endsWith('-once'))) {
      tile.isClear = true
    }
  }

  canMove(pos: PositionType): boolean {
    const tile = this.getTile(pos)

    return !!tile
  }

  getMap(sceneId: string) {
    return this.mapData[sceneId]
  }

  async changeScene(targetSceneId: MapId, context: GameContext) {
    const { player, map, broadcast } = context
    if (!this.mapData[targetSceneId]) {
      console.error(`[오류] 존재하지 않는 씬입니다: ${targetSceneId}`)
      return
    }

    this.currentSceneId = targetSceneId
    const newScene = this.getMap(targetSceneId)
    await assetManager.loadSceneAssets(newScene)
    const fixedArea: string[] = [MAP_IDS.B1_SUBWAY, MAP_IDS.B3_5_RESISTANCE_BASE, MAP_IDS.B4_Waste_Disposal_Area]

    if (!fixedArea.includes(targetSceneId)) {
      this.shuffleTiles(targetSceneId)
    }

    // 플레이어 위치를 새 맵의 시작 지점으로 이동
    const { x, y } = newScene.move_pos || newScene.start_pos
    player.x = x
    player.y = y

    Terminal.log(`\n------------------------------------------`)
    Terminal.log(i18n.t(`enter_new_area`) + i18n.t(`scene.${newScene.id}`))
    Terminal.log(`------------------------------------------`)

    const tile = map.getTile(player.pos)
    tile.isSeen = true

    await map.handleTileEvent(tile, context)
    broadcast.play()

    printTileStatus(context)
  }

  private shuffleTiles(sceneId: string) {
    const scene = _.cloneDeep(this.originMapData[sceneId])
    const { width, height } = { width: scene.tiles[0].length, height: scene.tiles.length }
    const start = scene.start_pos

    // 1. 타일 데이터 추출 및 분류
    let allTiles = _.compact(_.flatten(scene.tiles)) // undefined 제거 및 1차원화

    const startTile = scene.tiles[start.y][start.x]
    const bossTile = _.remove(allTiles, (t) => t.event === 'boss')[0]
    _.remove(allTiles, (t) => t === startTile)

    // 나머지 타일 셔플
    allTiles = _.shuffle(allTiles)

    // 2. 새로운 그리드 초기화
    const newGrid: (Tile | undefined)[][] = Array.from({ length: height }, () => Array(width).fill(undefined))
    newGrid[start.y][start.x] = startTile

    const candidates: string[] = []
    const getNeighbors = (x: number, y: number) =>
      [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ].filter((p) => p.x >= 0 && p.x < width && p.y >= 0 && p.y < height)

    const updateCandidates = (x: number, y: number) => {
      getNeighbors(x, y).forEach((p) => {
        const key = `${p.x},${p.y}`
        if (!newGrid[p.y][p.x] && !candidates.includes(key)) {
          candidates.push(key)
        }
      })
    }

    updateCandidates(start.x, start.y)

    // 3. 배치 로직
    const minBossDist = Math.floor((width + height) / 2)
    let bossPlaced = !bossTile

    while (candidates.length > 0) {
      // 랜덤하게 후보지 하나 선택
      const randomIndex = _.random(0, candidates.length - 1)
      const targetKey = _.pullAt(candidates, randomIndex)[0]
      const [cx, cy] = targetKey.split(',').map(Number)
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

    this.mapData[sceneId].tiles = newGrid as Tile[][]
  }

  isUnlocked(mapId: string, completed: string[]) {
    const unlocks = this.mapData[mapId]?.unlocks || []

    return unlocks.every((requirement: string) => completed.includes(requirement))
  }
}
