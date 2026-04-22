import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { CaronActions } from './action'
import { CaronService } from './service'

export class CaronNPC extends GameNPC {
  getChoices() {
    return [
      { name: 'talk', message: i18n.t('talk.speak') },
      { name: 'battle', message: i18n.t('npc.caron.battle') },
    ]
  }

  async handle(action: string, context: GameContext) {
    switch (action) {
      case 'talk':
        await this.processEvent(context)
        break
      case 'battle':
        await CaronActions.handleBattle(this, context, true)
        break
    }
    return true
  }

  private async processEvent(context: GameContext) {
    const count = CaronService.getEncounterCount()

    if (count === 0) {
      await CaronActions.firstEncounter(this, context)
      CaronService.incrementCount()
    } else if (count === 1) {
      await CaronActions.secondEncounter(this, context)
      CaronService.incrementCount()
    } else {
      await CaronActions.finalEncounter(this, context)
    }
  }

  hasQuest() {
    return true
  }
}
