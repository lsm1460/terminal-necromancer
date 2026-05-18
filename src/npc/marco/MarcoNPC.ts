import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { MerchantNPC, ShopScripts } from '~/systems/npc/MerchantNPC'
import { AppContext } from '~/systems/types'
import { MarcoService } from './service'
import { MarcoActions } from './action'

export class MarcoNPC extends MerchantNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const quest = MarcoService.getActiveQuest(context)
    if (quest) return [quest]

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'buy', message: i18n.t('talk.buy') },
      { name: 'sell', message: i18n.t('talk.sell') },
    ]
  }

  async handle(action: string, context: AppContext) {
    const buyScripts = i18n.t('npc.marco.buy', { returnObjects: true }) as ShopScripts
    const sellScripts = i18n.t('npc.marco.sell', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'talk':
        return this.handleTalk()
      case 'buy':
        await this.openBuyShop('marco_goods', buyScripts, context)
        break
      case 'sell':
        await this.openSellShop(sellScripts, context.player)
        break
      case 'talk1':
        return MarcoActions.handleFirst(context)
      case 'talk2':
        return MarcoActions.handleSecond(context)
      case 'talk3':
        return MarcoActions.handleThird(context)
      case 'talk4':
        return MarcoActions.handleFourth(context)
      case 'talk5':
        return MarcoActions.handleFifth(context)
      case 'talk6':
        return MarcoActions.handleSixth(context)
      case 'talk7':
        return MarcoActions.handleSeventh(context)
      default:
        break
    }
  }
}
