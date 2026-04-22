import { AppContext } from "~/systems/types"

export const PortalService = {
  /**
   * 플레이어를 현재 맵의 시작 지점으로 좌표 재설정
   */
  relocateToStart(context: AppContext) {
    const { player, map } = context
    const currentScene = map.currentScene

    player.x = currentScene.start_pos.x
    player.y = currentScene.start_pos.y
    
    return currentScene.id
  }
}