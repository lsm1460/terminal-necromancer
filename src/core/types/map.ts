import { GameContext, Monster, PositionType } from '.'
import { MapContainer } from '../MapContainer'

export interface Tile {
  id: string
  event: string
  dialogue: string
  observe: string
  npcIds?: string[] // npc용
  spawn_limit?: number // monster용
  monsters?: Monster[]
  isClear?: boolean
  isSeen?: boolean
}

export interface MapData {
  tiles: Tile[][]
}

export interface SceneData {
  id: string
  unlocks?: string[]
  start_pos: PositionType
  move_pos?: PositionType
  tiles: Tile[][]
}

export interface IMapManager {
  readonly container: MapContainer

  currentSceneId: string
  currentScene: SceneData
  changeScene(targetSceneId: string, context: GameContext): Promise<void>
  handleTileEvent(tile: Tile, context: GameContext): Promise<void>

  getTile(pos: PositionType): Tile
  canMove(pos: PositionType): boolean
  isUnlocked(id: string, events: string[]): boolean
  getMap(id: string): SceneData
}
