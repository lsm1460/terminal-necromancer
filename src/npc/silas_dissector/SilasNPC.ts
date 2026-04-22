import { GameContext, INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { SilasActions } from './action'
import { SilasService } from './service'

export class SilasNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const alreadyTalk = SilasService.isMet(context)

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    }

    // 첫 조우 시 '조사하기' 선택지 제공
    return [{ name: 'event', message: i18n.t('talk.examine') }]
  }

  hasQuest(context: GameContext) {
    // 아직 만나지 않은 상태라면 맵 상에 퀘스트 마크 표시
    return !SilasService.isMet(context)
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        this.handleTalk() // BaseNPC의 공통 대화 로직
        break
      case 'event':
        await SilasActions.handleEncounter(context)
        break
      default:
        break
    }
    return true
  }
}