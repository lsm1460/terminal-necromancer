import { MAP_IDS } from '~/consts'
import { MapManager } from '~/core/MapManager'
import i18n from '~/i18n'

export const ElevatorService = {
  /**
   * 현재 맵과 해금 상태를 기반으로 엘리베이터가 갈 수 있는 목록을 반환
   */
  getAvailableDestinations(mapManager: MapManager, currentSceneId: string, completedEvents: string[]) {
    return Object.entries(MAP_IDS)
      .filter(([_, value]) => {
        if (value === currentSceneId) return false

        return mapManager.isUnlocked(value, completedEvents)
      })
      .map(([_, value]) => {
        const mapData = mapManager.getMap(value)
        return {
          name: value,
          message: `🛗 ${i18n.t(`scene.${mapData.id}`)}`,
        }
      })
  },
}
