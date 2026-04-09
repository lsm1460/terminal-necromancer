import { MAP_IDS, MapId } from '~/consts'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/core/NpcManager'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'

export class ElevatorNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager, player: Player) {
    super(id, baseData, state, manager, player)
  }

  getChoices() {
    return [{ name: 'elevate', message: i18n.t('npc.elevator.choices.elevate') }]
  }

  hasQuest() {
    return false
  }

  async handle(action: string, player: Player, context: GameContext) {
    switch (action) {
      case 'elevate':
        return await this.handleElevate(player, context)
      default:
        break
    }
  }

  private async handleElevate(player: Player, context: GameContext) {
    const { map, events, world } = context
    const completed = events.getCompleted()
    const currentSceneId = map.currentSceneId

    const choices: {
      name: string
      message: string
    }[] = Object.entries(MAP_IDS)
      .filter(([_, value]) => value !== currentSceneId)
      .filter(([_, value]) => !([MAP_IDS.title, MAP_IDS.B1_Last] as string[]).includes(value))
      .filter(([_, value]) => map.isUnlocked(value, completed))
      .map(([_, value]) => {
        const mapData = map.getMap(value)

        return {
          name: value,
          message: `🛗 ${i18n.t(`scene.${mapData.id}`)}`,
        }
      })

    if (choices.length < 1) {
      Terminal.log(i18n.t('npc.elevator.menu.no_access'))
      return true
    }

    choices.push({ name: 'cancel', message: i18n.t('npc.elevator.menu.cancel') })

    const sceneId = await Terminal.select(i18n.t('npc.elevator.menu.title'), choices)

    if (sceneId === 'cancel') {
      return true
    }

    let enterMessage = ''
    if (currentSceneId !== MAP_IDS.B1_SUBWAY) {
      enterMessage = i18n.t('npc.elevator.confirm.leave_area')
    } else {
      enterMessage = i18n.t('npc.elevator.confirm.leave_safezone')
    }

    const proceed = await Terminal.confirm(enterMessage)

    if (!proceed) {
      Terminal.log(i18n.t('npc.elevator.confirm.cancel'))
      return true
    }

    const targetMapData = map.getMap(sceneId)

    if (targetMapData) {
      Terminal.log(i18n.t('npc.elevator.status.working'))

      world.clearFloor()
      await map.changeScene(sceneId as MapId, player, context)

      Terminal.log(i18n.t('npc.elevator.status.arrival', { location: i18n.t(`scene.${targetMapData.id}`) }))
      return true
    } else {
      console.error(i18n.t('npc.elevator.menu.error', { sceneId }))
    }
  }
}
