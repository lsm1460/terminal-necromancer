import { MAP_IDS, MapId } from '~/consts'
import { Terminal } from '~/core'
import i18n from '~/i18n'
import { SaveSystem } from '~/systems/SaveSystem'
import { AppContext } from '~/systems/types'
import { ElevatorService } from './service'

export const ElevatorActions = {
  async handleElevate(context: AppContext): Promise<boolean> {
    const { map, world, save } = context
    const completed = context.events.getCompleted()
    const currentSceneId = map.currentSceneId

    const { destinations: choices, isAllHidden } = ElevatorService.getAvailableDestinations(
      map,
      currentSceneId,
      completed
    )

    if (isAllHidden) {
      Terminal.log(i18n.t('npc.elevator.menu.no_access'))
      return true
    }

    choices.push({ name: 'cancel', message: i18n.t('npc.elevator.menu.cancel') })

    const sceneId = await Terminal.select(i18n.t('npc.elevator.menu.title'), choices)
    if (sceneId === 'cancel') return true

    const enterMessage =
      currentSceneId !== MAP_IDS.B1_SUBWAY
        ? i18n.t('npc.elevator.confirm.leave_area')
        : i18n.t('npc.elevator.confirm.leave_safezone')

    const proceed = await Terminal.confirm(enterMessage)
    if (!proceed) {
      Terminal.log(i18n.t('npc.elevator.confirm.cancel'))
      return true
    }

    const targetMapData = map.getMap(sceneId)
    if (targetMapData) {
      Terminal.log(i18n.t('npc.elevator.status.working'))
      world.clearFloor()
      await map.changeScene(sceneId as MapId, context)
      Terminal.log(
        i18n.t('npc.elevator.status.arrival', {
          location: i18n.t(`scene.${targetMapData.id}`),
        })
      )

      const saveData = SaveSystem.makeSaveData(context)
      save && save.save(saveData)

      return true
    }

    return false
  },
}
