import { GameContext, INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { GameNPC } from '~/systems/npc/GameNPC'
import { KnightActions } from './action'
import { KnightService } from './service'

export class KnightNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const quest = KnightService.getActiveQuest(context)
    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'upgrade', message: i18n.t('npc._knight.choices.upgrade') },
      { name: 'reset', message: i18n.t('npc._knight.choices.reset') },
    ]
  }

  hasQuest(context: GameContext) {
    return KnightService.getActiveQuest(context) !== null
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      case 'first':
        return await KnightActions.handleFirst(context)
      case 'upgrade':
        return await KnightActions.handleUpgrade(context.player as Necromancer)
      case 'reset':
        return await KnightActions.handleReset(context.player as Necromancer)
      default:
        return
    }
  }
}
