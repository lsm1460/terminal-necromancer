import fs from 'fs'
import { Tile } from '../types'
import { Player } from './Player'

interface SceneData {
  displayName: string
  start_pos: { x: number; y: number }
  tiles: Tile[][]
}

export class MapManager {
  private mapData: Record<string, SceneData>
  public currentSceneId: string

  constructor(path: string, initialSceneId?: string) {
    // 1. map.json 데이터 로드
    const data = fs.readFileSync(path, 'utf-8')
    this.mapData = JSON.parse(data)
    
    // 2. 초기 씬 ID 설정
    if (initialSceneId && this.mapData[initialSceneId]) {
      // 인자로 전달받은 ID가 있고, 실제 데이터에도 존재할 때
      this.currentSceneId = initialSceneId;
    } else {
      // 인자가 없거나 잘못된 경우, JSON의 첫 번째 키를 기본값으로 설정
      const sceneKeys = Object.keys(this.mapData);
      
      if (sceneKeys.length === 0) {
        throw new Error("map.json 파일에 설정된 씬 데이터가 없습니다.");
      }
      
      this.currentSceneId = sceneKeys[0];
    }
  }

  /**
   * 현재 활성화된 씬 데이터를 반환
   */
  get currentScene(): SceneData {
    return this.mapData[this.currentSceneId]
  }

  /**
   * 특정 좌표의 타일 정보 가져오기
   */
  getTile(x: number, y: number): Tile {
    return this.currentScene.tiles?.[y]?.[x]
  }

  /**
   * 해당 좌표로 이동 가능한지 확인
   */
  canMove(x: number, y: number): boolean {

    const tile = this.getTile(x, y)

    return !!tile
  }

  /**
   * 장면 전환 (Portal 이벤트 발생 시 호출)
   */
  changeScene(targetSceneId: string, player: Player) {
    if (!this.mapData[targetSceneId]) {
      console.error(`[오류] 존재하지 않는 씬입니다: ${targetSceneId}`)
      return
    }

    this.currentSceneId = targetSceneId
    const newScene = this.currentScene

    // 플레이어 위치를 새 맵의 시작 지점으로 이동
    player.x = newScene.start_pos.x
    player.y = newScene.start_pos.y

    console.log(`\n------------------------------------------`)
    console.log(`📍 새로운 지역 진입: ${newScene.displayName}`)
    console.log(`------------------------------------------`)
  }
}
