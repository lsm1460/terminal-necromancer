import { Player } from '../player/Player'
import { GameContext, IMapManager, PositionType, SceneData, Tile } from '../types'
import { MapData } from './MapData'

export class BaseMapManager implements IMapManager {
  public currentSceneId: string

  constructor(
    protected readonly data: MapData,
    startSceneId?: string
  ) {
    this.currentSceneId = startSceneId ?? this.data.getFirstSceneId()
  }

  get currentScene(): SceneData {
    return this.data.getScene(this.currentSceneId)
  }

  public async changeScene(targetId: string, { player }: { player: Player }): Promise<void> {
    const scene = this.data.getScene(targetId)
    if (!scene) {
      console.error(`[Map] Scene not found: ${targetId}`)
      return
    }
    this.currentSceneId = targetId

    const { x, y } = scene.move_pos || scene.start_pos
    player.x = x
    player.y = y
  }

  getMap(sceneId: string): SceneData {
    return this.data.getMap(sceneId)
  }

  public getTile(pos: PositionType) {
    return this.data.getTile(this.currentSceneId, pos)
  }

  public canMove(pos: PositionType): boolean {
    return !!this.getTile(pos)
  }

  isUnlocked(mapId: string, completed: string[]) {
    return this.data.isUnlocked(mapId, completed)
  }

  async handleTileEvent(tile: Tile, context: GameContext) {}
}
