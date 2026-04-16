import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/systems/NpcManager'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'
import { ApostleActions } from './action'
import { ApostleService } from './service'

export class ApostleNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const activeAction = ApostleService.getActiveAction(context)

    if (activeAction?.name === 'event') {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
    }

    return [{ name: 'talk', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    return !ApostleService.isEventCompleted(context)
  }

  async handle(action: string, context: GameContext) {
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
