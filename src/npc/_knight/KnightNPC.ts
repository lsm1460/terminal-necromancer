import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { KnightActions } from './action'
import { KnightService } from './service'

export class KnightNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const quest = KnightService.getActiveQuest(context)
    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'upgrade', message: i18n.t('npc._knight.choices.upgrade') },
      { name: 'reset', message: i18n.t('npc._knight.choices.reset') },
    ]
  }

  hasQuest(context: AppContext) {
    return KnightService.getActiveQuest(context) !== null
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      case 'first':
        return await KnightActions.handleFirst(context)
      case 'upgrade':
        return await KnightActions.handleUpgrade(context.player)
      case 'reset':
        return await KnightActions.handleReset(context.player)
      default:
        return
    }
  }
}
