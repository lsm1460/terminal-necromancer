import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCState } from '~/core/types'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'

export class EchoNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
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
