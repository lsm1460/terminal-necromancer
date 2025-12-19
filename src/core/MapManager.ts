// core/MapManager.ts
import fs from 'fs'
import { Tile } from '../types'

export class MapManager {
  map: Tile[][]

  constructor(path: string) {
    this.map = JSON.parse(fs.readFileSync(path, 'utf-8'))
  }

  tile(x: number, y: number): Tile {
    return this.map[y][x]
  }

  canMove(x: number, y: number): boolean {
    // 좌표 범위 체크
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) return false

    // 해당 타일이 null이면 이동 불가
    return !!this.map[y][x]
  }
}
