import { BaseNPC } from '~/core/npc/BaseNPC'
import { NPCManager } from '~/core/NpcManager'
import i18n from '~/i18n'
import { GameContext, NPCState } from '~/types'
import { PortalActions } from './action'

export class PortalNPC extends BaseNPC {
  // 생성자에서 player를 파라미터로 받지 않도록 수정
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    // 부모 클래스인 BaseNPC가 player를 요구한다면 null이나 빈 객체를 넘기기보다 
    // BaseNPC의 정의 자체를 수정하는 것이 가장 좋지만, 우선 manager만 넘깁니다.
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'portal', message: i18n.t('npc.portal.choices.move') }]
  }

  async handle(action: string, context: GameContext) {
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