import { GameContext, INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { MerchantNPC, ShopScripts } from '~/systems/npc/MerchantNPC'

export class VendingMachineNPC extends MerchantNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices() {
    return [{ name: 'buy', message: i18n.t('talk.buy') }]
  }

  async handle(action: string, context: GameContext) {
    const buyScripts = i18n.t('npc.vending_machine.buy', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'buy':
        await this.openBuyShop('potion_goods', buyScripts, context)
        break
      default:
        break
    }
  }
}
