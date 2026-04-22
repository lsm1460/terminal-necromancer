import { GameContext, INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { JaxActions } from './action'
import { JaxService } from './service'
import { AppContext } from '~/systems/types'

export class JaxNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const quest = JaxService.getActiveAction(context)

    // 가입 전이면 '대화하기(join)' 선택지만 노출
    if (quest) {
      return [{ name: 'join', message: i18n.t('talk.small_talk') }]
    }

    // 가입 후라면 일반 대화와 기지 입장 선택지 노출
    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'enter', message: i18n.t('npc.jax_seeker.choices.enter') },
    ]
  }

  hasQuest(context: AppContext) {
    return !JaxService.isJoined(context)
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        this.handleTalk()
        break
      case 'enter':
        await JaxActions.handleEnter(context)
        break
      case 'join':
        await JaxActions.handleJoin(this, context)
        break
      default:
        break
    }
    return true
  }
}
