import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/core/NpcManager'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'
import { AdrianActions } from './action'
import { AdrianService } from './service'

export class AdrianNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const quest = AdrianService.getActiveQuest(context)

    if (quest) {
      return [quest]
    }

    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  hasQuest(context: GameContext) {
    return AdrianService.getActiveQuest(context) !== null
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      case 'event':
        return await AdrianActions.handleEvent(context)
      default:
        return
    }
  }
}
