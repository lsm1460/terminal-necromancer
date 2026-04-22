import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { JulianActions } from './action'
import { JulianService } from './service'

export class JulianNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const alreadyTalk = JulianService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 아직 만나지 않았다면 '조사하기(event)' 선택지 노출
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: AppContext) {
    // 미조우 상태일 때 맵에 이벤트 마크 표시
    return !JulianService.isMet(context)
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC의 기본 대화 로직 실행
        break
      case 'event':
        await JulianActions.handleEncounter(context)
        break
      default:
        break
    }
    return true
  }
}