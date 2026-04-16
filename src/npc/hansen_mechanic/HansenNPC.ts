import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/systems/NpcManager'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'
import { HansenActions } from './action'
import { HansenService } from './service'

export class HansenNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = HansenService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    // 아직 조우하지 않은 상태라면 퀘스트 마크 노출
    return !HansenService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC의 기본 대화 로직
        break
      case 'event':
        await HansenActions.handleEncounter(context)
        break
      default:
        break
    }
    return true
  }
}
