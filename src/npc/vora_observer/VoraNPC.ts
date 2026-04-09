import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/types'
import { NPCManager } from '~/core/NpcManager'
import i18n from '~/i18n'
import { VoraService } from './service'
import { VoraActions } from './action'

export class VoraNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = VoraService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 첫 만남 시 '조사하기' 선택지 제공
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    // 미조우 상태일 때 맵 상에 퀘스트 마크 노출
    return !VoraService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC 공통 대화 로직
        break
      case 'event':
        await VoraActions.handleEncounter(context)
        break
      default:
        break
    }
    return true
  }
}