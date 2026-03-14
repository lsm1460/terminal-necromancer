import i18n from '~/i18n'
import { handleBuy, NPCHandler, ShopScripts } from './NPCHandler'

const VendingMachineHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [{ name: 'buy', message: i18n.t('talk.buy') }]
  },
  async handle(action, player, npc, context) {
    const buyScripts = i18n.t('npc.vending_machine.buy', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'buy':
        await handleBuy(player, npc, context, 'potion_goods', buyScripts)
        break
      default:
        break
    }
  },
}

export default VendingMachineHandler
