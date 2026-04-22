import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import * as SubspaceActions from './actions'

export class SubspaceNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const { player, events } = context
    const isTutorialCompleted = events.isCompleted('tutorial_knight')

    // 강한 해골(HP 200↑)이 있는데 기사 승격 튜토리얼을 안 봤다면 퀘스트 우선 노출
    if (player.skeleton.some((sk) => sk.maxHp >= 200) && !isTutorialCompleted) {
      return [{ name: 'tutorialPromotion', message: i18n.t('npc.subspace.choices.tutorial_knight') }]
    }

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
    }
    return true
  }

  hasQuest(context: AppContext) {
    return context.player.skeleton.some((sk) => sk.maxHp >= 200) && !context.events.isCompleted('tutorial_knight')
  }
}
