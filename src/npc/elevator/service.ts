import { MAP_IDS } from '~/consts'
import { MapManager } from '~/systems/MapManager'
import i18n from '~/i18n'

export const ElevatorService = {
  getAvailableDestinations(mapManager: MapManager, currentSceneId: string, completedEvents: string[]) {
    const destinations = Object.entries(MAP_IDS)
      .filter(([_, value]) => value !== currentSceneId)
      .map(([_, value]) => {
        const isUnlocked = mapManager.isUnlocked(value, completedEvents)
        const mapData = mapManager.getMap(value)

        return {
          name: value as string,
          message: isUnlocked ? `🛗 ${i18n.t(`scene.${mapData.id}`)}` : '???',
          disabled: !isUnlocked,
          isUnlocked,
        }
      })

    const isAllHidden = destinations.every((d) => !d.isUnlocked)

    return {
      destinations,
      isAllHidden,
    } as {
      destinations: { name: string; message: string }[]
      isAllHidden: boolean
    }
  },
}
