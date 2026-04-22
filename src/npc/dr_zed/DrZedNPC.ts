import { GameContext, INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { GameNPC } from '~/systems/npc/GameNPC'
import { ZedActions } from './action'
import { ZedService } from './service'

export class ZedNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: GameContext) {
    const necromancer = context.player as Necromancer
    const quest = ZedService.getActiveQuest(context)
    const isB3Completed = context.events.isCompleted('second_boss')

    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      ...(isB3Completed && !necromancer.golem ? [{ name: 'golem', message: i18n.t('npc.dr_zed.choices.awake_golem') }] : []),
      ...(isB3Completed && necromancer.golem
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
        return await ZedActions.handleAwakeGolem(context.player as Necromancer, context.events)
      case 'upgrade_golem':
        return await ZedActions.handleUpgradeGolem(context.player as Necromancer)
      default:
        return 
    }
  }
}
