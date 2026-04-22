import { MerchantNPC, ShopScripts } from '~/core/npc/MerchantNPC'
import { GameContext, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'

export class MarcoNPC extends MerchantNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [
      { name: 'buy', message: i18n.t('talk.buy') },
      { name: 'sell', message: i18n.t('talk.sell') },
    ]
  }

  async handle(action: string, context: GameContext) {
    const buyScripts = i18n.t('npc.marco.buy', { returnObjects: true }) as ShopScripts
    const sellScripts = i18n.t('npc.marco.sell', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'buy':
        await this.openBuyShop('marco_goods', buyScripts, context)
        break
      case 'sell':
        await this.openSellShop(sellScripts, context.player)
        break
      default:
        break
    }
  }
}
