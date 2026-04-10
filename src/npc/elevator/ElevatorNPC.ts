import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/core/NpcManager'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'
import { ElevatorActions } from './action'

export class ElevatorNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'elevate', message: i18n.t('npc.elevator.choices.elevate') }]
  }

  hasQuest() {
    return false
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'elevate':
        return await ElevatorActions.handleElevate(context)
      default:
        return
    }
  }
}