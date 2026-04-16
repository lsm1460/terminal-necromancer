import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/types'
import { NPCManager } from '~/systems/NpcManager'
import i18n from '~/i18n'
import { KaelService } from './service'
import { KaelActions } from './action'

export class KaelNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const isEncountered = KaelService.isEncountered(context)

    if (isEncountered) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 미조우 상태라면 이벤트 선택지 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    return !KaelService.isEncountered(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk()
        break
      case 'event':
        return await KaelActions.handleDiscovery(this, context)
      default:
        break
    }
    return true
  }
}