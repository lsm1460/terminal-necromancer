import i18n from '~/i18n'
import { handleBuy, handleSell, NPCHandler, ShopScripts } from './NPCHandler'

const MarcoHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'buy', message: i18n.t('talk.buy') },
      { name: 'sell', message: i18n.t('talk.sell') },
    ]
  },
  async handle(action, player, npc, context) {
    const buyScripts = i18n.t('npc.marco.buy', { returnObjects: true }) as ShopScripts
    const sellScripts = i18n.t('npc.marco.sell', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'buy':
        await handleBuy(player, npc, context, 'marco_goods', buyScripts)
        break
      case 'sell':
        await handleSell(player, npc, context, sellScripts)
        break
      default:
        break
    }
  },
}

export default MarcoHandler
