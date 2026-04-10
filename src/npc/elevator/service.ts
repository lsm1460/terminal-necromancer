import { MAP_IDS } from '~/consts'
import i18n from '~/i18n'

export const ElevatorService = {
  /**
   * 현재 맵과 해금 상태를 기반으로 엘리베이터가 갈 수 있는 목록을 반환
   */
  getAvailableDestinations(mapManager: any, currentSceneId: string, completedEvents: string[]) {
    return Object.entries(MAP_IDS)
      .filter(([_, value]) => {
        // 현재 위치 제외
        if (value === currentSceneId) return false
        // 특수 맵(타이틀, 최종층 등) 제외
        if (([MAP_IDS.title, MAP_IDS.B1_Last] as string[]).includes(value)) return false
        // 해금 여부 확인
        return mapManager.isUnlocked(value, completedEvents)
      })
      .map(([_, value]) => {
        const mapData = mapManager.getMap(value)
        return {
          name: value,
          message: `🛗 ${i18n.t(`scene.${mapData.id}`)}`,
        }
      })
  }
}