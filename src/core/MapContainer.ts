import cloneDeep from 'lodash/cloneDeep'
import { MAP_IDS, MapId } from '~/consts'
import { PositionType, SceneData, Tile } from './types'

export class MapContainer {
  private _mapData: Record<string, SceneData>
  private _originMapData: Record<string, SceneData>
  public currentSceneId: MapId

  constructor(mapData: any) {
    this._mapData = JSON.parse(JSON.stringify(mapData))
    this._originMapData = JSON.parse(JSON.stringify(mapData))
    this.currentSceneId = MAP_IDS.B1_SUBWAY
  }

  get currentScene(): SceneData {
    return this._mapData[this.currentSceneId]
  }

  getTile({ x, y }: PositionType, sceneId = this.currentSceneId): Tile {
    return this._mapData[sceneId]?.tiles?.[y]?.[x]
  }

  getMap(sceneId: string): SceneData {
    return this._mapData[sceneId]
  }

  getOriginScene(sceneId: string): SceneData {
    return cloneDeep(this._originMapData[sceneId])
  }

  updateSceneTiles(sceneId: string, newGrid: Tile[][]) {
    if (this._mapData[sceneId]) {
      this._mapData[sceneId].tiles = newGrid
    }
  }

  isUnlocked(mapId: string, completed: string[]) {
    const unlocks = this._mapData[mapId]?.unlocks || []

    return unlocks.every((requirement: string) => completed.includes(requirement))
  }

  canMove(pos: PositionType): boolean {
    const tile = this.getTile(pos);
    return !!tile
  }
}
