import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/types'
import { NPCManager } from '~/systems/NpcManager'
import i18n from '~/i18n'
import { FlintService } from './service'
import { FlintActions } from './action'

export class FlintNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
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