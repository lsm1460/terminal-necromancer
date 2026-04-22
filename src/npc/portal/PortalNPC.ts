import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { PortalActions } from './action'

export class PortalNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'portal', message: i18n.t('npc.portal.choices.move') }]
  }

  async handle(action: string, context: AppContext) {
    switch (action) {
      case 'portal':
        return await PortalActions.handleMove(context)
      default:
        return true
    }
  }

  // 포탈은 항상 상호작용 가능하므로 false 또는 필요에 따라 조정
  hasQuest() {
    return false
  }
}