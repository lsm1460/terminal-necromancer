import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import * as SubspaceActions from './actions'
import { SubspaceService } from './service'

export class SubspaceNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const { events } = context
    const isTutorialCompleted = events.isCompleted('tutorial_knight')

    const quest = SubspaceService.getActiveQuest(context)
    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'increaseLimit', message: i18n.t('npc.subspace.choices.increase_limit') },
      { name: 'space', message: i18n.t('npc.subspace.choices.space') },
      { name: 'mix', message: i18n.t('npc.subspace.choices.mix') },
      ...(isTutorialCompleted ? [{ name: 'promotion', message: i18n.t('npc.subspace.choices.promotion') }] : []),
    ]
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        await this.handleTalk()
        break
      case 'increaseLimit':
        await SubspaceActions.handleIncreaseLimit(context)
        break
      case 'space':
        await SubspaceActions.handleManageSpace(context)
        break
      case 'mix':
        await SubspaceActions.handleMix(context)
        break
      case 'promotion':
        await SubspaceActions.handlePromotion(context)
        break
      case 'tutorialPromotion':
        await SubspaceActions.handleTutorialPromotion(context.events)
        break
      case 'joinFinalBattle':
        await SubspaceActions.handleJoinFinalBattle(context.events)
        break
      case 'suspicion':
        await SubspaceActions.handleSuspicion(context.events)
        break
    }
    return true
  }

  hasQuest(context: AppContext) {
    return SubspaceService.getActiveQuest(context) !== null
  }
}
