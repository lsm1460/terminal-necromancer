import { MerchantNPC, ShopScripts } from '~/core/npc/MerchantNPC'
import { GameContext, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { NPCManager } from '~/systems/NpcManager'

export class VendingMachineNPC extends MerchantNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: NPCManager) {
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
