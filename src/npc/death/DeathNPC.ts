import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import BossEvent from '~/systems/events/BossEvent'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { GameNPC } from '~/systems/npc/GameNPC'
import { DeathAction } from './actions'
import { DeathService } from './service'

export class DeathNPC extends GameNPC {
  getChoices(context: GameContext) {
    const quest = DeathService.getActiveQuest(context)
    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'levelUp', message: i18n.t('npc.death.levelup') },
      { name: 'unlock', message: i18n.t('npc.death.unlock_skills') },
      { name: 'memorize', message: i18n.t('npc.death.engrave_skills') },
    ]
  }

  hasQuest(context: GameContext) {
    return DeathService.getActiveQuest(context) !== null
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        return this.handleTalk()
      case 'levelUp':
        return await DeathAction.handleLevelUp(context.player)

      // skill
      case 'unlock':
        return await DeathAction.handleUnlock(context)
      case 'memorize':
        return await DeathAction.handleMemorize(context.player as Necromancer)

      // story
      case 'intro':
        return await DeathAction.handleIntro(context)
      case 'tutorialOver':
        return await DeathAction.handleTutorialOver(context)
      case 'defeatGolem':
        return await DeathAction.handleDefeatGolem(context)
      case 'reportCaron':
        return await DeathAction.handleReportCaron(context)
      case 'cleanupVipLounge':
        return await DeathAction.handleAfterCleanup(context)

      case 'end':
        return await DeathAction.handleEnd(context)
      default:
        return true
    }
  }

  async afterDead(context: GameContext) {
    context.npcs.setAlive(this.id)

    await BossEvent.handle(context)
  }
}
