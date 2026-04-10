import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/types'
import { NPCManager } from '~/core/NpcManager'
import i18n from '~/i18n'
import { ShadowedService } from './service'
import { ShadowedActions } from './action'

export class ShadowedNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = ShadowedService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 첫 조우 시 '조사하기' 선택지 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    // 미조우 상태일 때 맵 상에 이벤트 마크 표시
    return !ShadowedService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC 공통 대화 로직
        break
      case 'event':
        await ShadowedActions.handleEncounter(context)
        break
      default:
        break
    }
    return true
  }
}