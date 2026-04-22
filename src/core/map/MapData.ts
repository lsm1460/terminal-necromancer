import { SceneData, Tile, PositionType } from '../types'
import cloneDeep from 'lodash/cloneDeep'

export class MapData {
  private _currentMapData: Record<string, SceneData>
  private readonly _originMapData: Record<string, SceneData>

  constructor(mapData: any) {
    this._originMapData = cloneDeep(mapData)
    this._currentMapData = cloneDeep(mapData)
  }

  getMap(sceneId: string): SceneData {
    return this._currentMapData[sceneId]
  }

  public getScene(id: string): SceneData {
    return this._currentMapData[id]
  }

  public getOriginScene(id: string): SceneData {
    return cloneDeep(this._originMapData[id])
  }

  public updateTiles(id: string, newTiles: Tile[][]) {
    if (this._currentMapData[id]) {
      this._currentMapData[id].tiles = newTiles
    }
  }

  public getTile(sceneId: string, { x, y }: PositionType): Tile | undefined | null {
    return this._currentMapData[sceneId]?.tiles?.[y]?.[x]
  }

  public isUnlocked(sceneId: string, completedEvents: string[]): boolean {
    const unlocks = this._currentMapData[sceneId]?.unlocks || []
    return unlocks.every((req) => completedEvents.includes(req))
  }

  public getFirstSceneId(): string {
    const keys = Object.keys(this._currentMapData);
    if (keys.length === 0) {
      throw new Error("[MapData] 데이터에 씬이 존재하지 않습니다.");
    }
    return keys[0]; // 첫 번째 키 반환
  }
}
