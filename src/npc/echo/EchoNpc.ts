import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { EchoActions } from './action'
import { EchoService } from './service'

export class EchoNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const quest = EchoService.getActiveQuest(context)
    if (quest) return [quest]

    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      case 'talk1':
        return EchoActions.handleFirst(context)
      case 'talk2':
        return EchoActions.handleSecond(context)
      case 'talk3':
        return EchoActions.handleThird(context)
      case 'talk4':
        return EchoActions.handleFourth(context)
      case 'talk5':
        return EchoActions.handleFifth(context)
      case 'talk6':
        return EchoActions.handleSixth(context)
      case 'talk7':
        return EchoActions.handleSeventh(context)
      default:
        return
    }
  }
}
