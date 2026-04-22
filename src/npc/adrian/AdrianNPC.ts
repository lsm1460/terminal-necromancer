import { GameContext, INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AdrianActions } from './action'
import { AdrianService } from './service'

export class AdrianNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
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
