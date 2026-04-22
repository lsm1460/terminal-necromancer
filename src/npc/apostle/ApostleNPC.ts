import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { ApostleActions } from './action'
import { ApostleService } from './service'

export class ApostleNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const activeAction = ApostleService.getActiveAction(context)

    if (activeAction?.name === 'event') {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
    }

    return [{ name: 'talk', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: AppContext) {
    return !ApostleService.isEventCompleted(context)
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC에 구현된 기본 대화
        return true
      case 'event':
        return await ApostleActions.handleEvent(context)
      default:
        return true
    }
  }
}
