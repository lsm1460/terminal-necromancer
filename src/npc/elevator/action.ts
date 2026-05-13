import { MAP_IDS, MapId } from '~/consts'
import { Terminal } from '~/core'
import i18n from '~/i18n'
import { Necromancer } from '~/systems'
import { getPlayerSkills } from '~/systems/skill/player'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'
import { ElevatorService } from './service'

export const ElevatorActions = {
  async handleElevate(context: AppContext): Promise<boolean> {
    const { map, world, save, player } = context
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

    if (!context.events.isCompleted('elevator_guide')) {
      await speak(i18n.t('npc.elevator.guide', { returnObjects: true }) as string[])
      context.events.completeEvent('elevator_guide')
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
      try{
        await map.changeScene(sceneId as MapId, context)
      } catch(_e) {
        console.log(_e)
      }
      Terminal.log(
        i18n.t('npc.elevator.status.arrival', {
          location: i18n.t(`scene.${targetMapData.id}`),
        })
      )

      player.removeMercenaries()
      const { currentTile } = context
      currentTile.isSeen = true

      save && save.save(context)

      return true
    }

    return false
  },

  async handleMemorize(player: Necromancer) {
    const playerSkills = getPlayerSkills()
    const welcomeMessage = i18n.t('npc.elevator.memorize.welcome')
    
    Terminal.log(`\n${welcomeMessage}\n${i18n.t('npc.elevator.memorize.limit_info', { max: player.maxMemorize })}`)

    const skillChoices = ElevatorService.getMemorizeChoices(player)

    try {
      const selectedNames = await Terminal.multiselect(
        i18n.t('npc.elevator.memorize.select_prompt', { max: player.maxMemorize }),
        skillChoices,
        { 
          initial: player.memorize.map(id => playerSkills[id].name), 
          maxChoices: player.maxMemorize 
        }
      )

      if (selectedNames.length > player.maxMemorize) {
        Terminal.log(i18n.t('npc.elevator.memorize.validate_max', { max: player.memorize.length }))
        return true
      }

      player.memorize = selectedNames.map(name => ElevatorService.getSkillIdByName(name))
      Terminal.log(i18n.t('npc.elevator.memorize.complete', { count: player.memorize.length }))
    } catch {
      Terminal.log(i18n.t('npc.elevator.memorize.cancel'))
    }
    return true
  }
}
