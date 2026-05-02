import { PositionType } from '.'
import { Monster } from '../battle/Monster'
import { Player } from '../player/Player'

export interface Tile {
  id: string
  event: string
  dialogue: string
  observe: string
  assets?: string[]
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

export interface IMinContext {
  player: Player
}

export interface IMapManager<TContext extends IMinContext = any> {
  currentSceneId: string
  currentScene: SceneData
  changeScene(targetId: string, context: TContext): Promise<void>
  handleTileEvent(tile: Tile, context: TContext): Promise<void>

  getTile(pos: PositionType): Tile | undefined | null
  canMove(pos: PositionType): boolean
  isUnlocked(id: string, events: string[]): boolean
  getMap(id: string): SceneData
}
