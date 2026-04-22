import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'
import { DaxActions } from './action'
import { DaxService } from './service'

export class DaxNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = DaxService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 첫 대면 전이라면 '조사하기(event)' 선택지 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    // 아직 만나지 않았다면 맵에 퀘스트 마크 표시
    return !DaxService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC의 기본 대화 로직
        return true
      case 'event':
        return await DaxActions.handleEncounter(context)
      default:
        return true
    }
  }
}
