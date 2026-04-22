import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'
import { KaneActions } from './action'
import { KaneService } from './service'

export class KaneNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const quest = KaneService.getActiveAction(context)
    if (quest) {
      return [{ name: quest.name, message: i18n.t(quest.message) }]
    }

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'donation', message: i18n.t('npc.kane_leader.choice.donation') }
    ]
  }

  hasQuest(context: GameContext) {
    return KaneService.getActiveAction(context) !== null
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'join':
        await KaneActions.handleJoin(this, context)
        break
      case 'talk':
        this.handleTalk()
        break
      case 'donation':
        await KaneActions.handleDonation(this, context)
        break
      case 'B5Operation':
        await KaneActions.handleBriefing(this, context)
        break
    }
    return true
  }
}