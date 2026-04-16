import { MAP_IDS } from '~/consts'
import { MapManager } from '~/core/MapManager'
import i18n from '~/i18n'

export const ElevatorService = {
  getAvailableDestinations(mapManager: MapManager, currentSceneId: string, completedEvents: string[]) {
    return Object.entries(MAP_IDS)
      .filter(([_, value]) => {
        if (value === currentSceneId) return false

        return true
      })
      .map(([_, value]) => {
        const isUnlocked = mapManager.isUnlocked(value, completedEvents)
        const mapData = mapManager.getMap(value)

        return {
          name: value,
          message: isUnlocked? `🛗 ${i18n.t(`scene.${mapData.id}`)}` : '???',
          disabled: !isUnlocked
        }
      })
  },
}
