import fs from 'fs'
import _ from 'lodash'
import { MAP_IDS, MapId } from '../consts'
import { Tile } from '../types'
import { Player } from './Player'

interface SceneData {
  displayName: string
  unlocks?: string[]
  start_pos: { x: number; y: number }
  move_pos?: { x: number; y: number }
  tiles: Tile[][]
}

export class MapManager {
  private originMapData: Record<string, SceneData>
  private mapData: Record<string, SceneData>
  public currentSceneId: MapId

  constructor(path: string) {
    // 1. map.json 데이터 로드
    const data = fs.readFileSync(path, 'utf-8')
    this.mapData = JSON.parse(data)
    this.originMapData = JSON.parse(data)

    // 2. 초기 씬 ID 설정
    this.currentSceneId = MAP_IDS.B1_SUBWAY
  }

  get currentScene(): SceneData {
    return this.mapData[this.currentSceneId]
  }

  getTile(x: number, y: number): Tile {
    return this.currentScene.tiles?.[y]?.[x]
  }

  canMove(x: number, y: number): boolean {
    const tile = this.getTile(x, y)

    return !!tile
  }

  getMap(sceneId: string) {
    return this.mapData[sceneId]
  }

  changeScene(targetSceneId: MapId, player: Player) {
    if (!this.mapData[targetSceneId]) {
      console.error(`[오류] 존재하지 않는 씬입니다: ${targetSceneId}`)
      return
    }

    this.currentSceneId = targetSceneId
    const newScene = this.currentScene

    const fixedArea: string[] = [MAP_IDS.B1_SUBWAY, MAP_IDS.B3_5_RESISTANCE_BASE, MAP_IDS.B4_Waste_Disposal_Area]

    if (!fixedArea.includes(targetSceneId)) {
      this.shuffleTiles(targetSceneId)
    }

    // 플레이어 위치를 새 맵의 시작 지점으로 이동
    const { x, y } = newScene.move_pos || newScene.start_pos
    player.x = x
    player.y = y

    console.log(`\n------------------------------------------`)
    console.log(`📍 새로운 지역 진입: ${newScene.displayName}`)
    console.log(`------------------------------------------`)
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
