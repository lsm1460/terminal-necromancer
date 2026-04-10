import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/types'
import { NPCManager } from '~/core/NpcManager'
import i18n from '~/i18n'
import { VesperService } from './service'
import { VesperActions } from './action'

export class VesperNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const isEncountered = VesperService.isEncountered(context)

    if (isEncountered) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 카엘과 마찬가지로 아직 만나지 않았다면 이벤트 선택지 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    return !VesperService.isEncountered(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC의 기본 대화 로직
        break
      case 'event':
        // 베스퍼를 통해 말을 걸어도 카엘과의 조우 시퀀스가 실행됨
        return await VesperActions.handleDiscovery(this, context)
      default:
        break
    }
    return true
  }
}
