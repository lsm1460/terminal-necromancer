import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { KaelActions } from './action'
import { KaelService } from './service'

export class KaelNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const isEncountered = KaelService.isEncountered(context)

    if (isEncountered) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 미조우 상태라면 이벤트 선택지 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: AppContext) {
    return !KaelService.isEncountered(context)
  }

  async handle(action: string, context: AppContext) {
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