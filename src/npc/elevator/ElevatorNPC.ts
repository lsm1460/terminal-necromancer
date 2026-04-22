import { INpcManager, NPCState } from "~/core/types"
import i18n from "~/i18n"
import { GameNPC } from "~/systems/npc/GameNPC"
import { AppContext } from "~/systems/types"
import { ElevatorActions } from "./action"


export class ElevatorNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'elevate', message: i18n.t('npc.elevator.choices.elevate') }]
  }

  hasQuest() {
    return false
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'elevate':
        return await ElevatorActions.handleElevate(context)
      default:
        return
    }
  }
}