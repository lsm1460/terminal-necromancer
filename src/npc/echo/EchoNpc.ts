import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'

export class EchoNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  async handle(action: string) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      default:
        return
    }
  }
}
