import { GameContext, INpcManager, NPCState } from "~/core/types"
import i18n from "~/i18n"
import { Necromancer } from "~/systems/job/necromancer/Necromancer"
import { GameNPC } from "~/systems/npc/GameNPC"
import { FlintActions } from "./action"
import { FlintService } from "./service"


export class FlintNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const activeAction = FlintService.getActiveAction(context)

    if (activeAction) {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
    }

    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  hasQuest(context: GameContext) {
    return !FlintService.isEventCompleted(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk()
        break
      case 'event':
        return await FlintActions.handleEncounter(this, context)
      default:
        break
    }
    return true
  }
}