import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { RattyActions } from './action'
import { RattyService } from './service'

export class RattyNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const alreadyTalk = RattyService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 아직 만나지 않았다면 '위협하기' 선택지 노출
    return [{ name: 'threat', message: i18n.t('talk.small_talk') }]
  }

  hasQuest(context: AppContext) {
    return !RattyService.isMet(context)
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        this.handleTalk()
        return true
      case 'threat':
        return await RattyActions.handleThreat(context)
      default:
        return true
    }
  }
}