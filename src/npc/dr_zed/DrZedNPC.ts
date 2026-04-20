import { BaseNPC } from '~/core/npc/BaseNPC'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'
import { GameContext, NPCState } from '~/types'
import { ZedActions } from './action'
import { ZedService } from './service'

export class ZedNPC extends BaseNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const quest = ZedService.getActiveQuest(context)
    const isB3Completed = context.events.isCompleted('second_boss')

    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      ...(isB3Completed && !context.player.golem ? [{ name: 'golem', message: i18n.t('npc.dr_zed.choices.awake_golem') }] : []),
      ...(isB3Completed && context.player.golem
        ? [{ name: 'upgrade_golem', message: i18n.t('npc.dr_zed.choices.upgrade_golem') }]
        : []),
      { name: 'heal', message: i18n.t('talk.heal') },
    ]
  }

  hasQuest(context: GameContext) {
    return ZedService.getActiveQuest(context) !== null
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk() // BaseNPC의 메서드 사용
      case 'resistance':
        return await ZedActions.handleGossip(context)
      case 'heal':
        return ZedActions.handleHeal(context.player)
      case 'golem':
        return await ZedActions.handleAwakeGolem(context)
      case 'upgrade_golem':
        return await ZedActions.handleUpgradeGolem(context.player)
      default:
        return 
    }
  }
}
