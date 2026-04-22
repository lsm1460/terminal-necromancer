import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { OliverActions } from './action'
import { OliverService } from './service'

export class OliverNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const alreadyTalk = OliverService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 아직 유언을 듣지 못했다면 '조사하기' 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: AppContext) {
    // 유언 이벤트가 남은 경우 맵에 표시
    return !OliverService.isMet(context)
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC 기본 대화
        break
      case 'event':
        await OliverActions.handleLastWords(this, context)
        break
      default:
        break
    }
    return true
  }
}