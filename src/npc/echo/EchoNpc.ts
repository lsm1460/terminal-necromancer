import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/core/NpcManager'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'

export class EchoNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      default:
        return
    }
  }
}
