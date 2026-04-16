import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/systems/NpcManager'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'
import { RattyActions } from './action'
import { RattyService } from './service'

export class RattyNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = RattyService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 아직 만나지 않았다면 '위협하기' 선택지 노출
    return [{ name: 'threat', message: i18n.t('talk.small_talk') }]
  }

  hasQuest(context: GameContext) {
    return !RattyService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
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