import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { MerchantNPC, ShopScripts } from '~/systems/npc/MerchantNPC'
import { AppContext } from '~/systems/types'
import { MayaActions } from './action'
import { MayaService } from './service'

export class MayaNPC extends MerchantNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    const { player, events } = context
    const quest = MayaService.getActiveQuest(context)
    if (quest) return [quest]

    const canUpgrade = this.factionContribution >= 40 && events.isCompleted('second_boss') && !!player.golem

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'buy', message: i18n.t('talk.buy') },
      { name: 'sell', message: i18n.t('talk.sell') },
      ...(!player.golem ? [{ name: 'golem', message: i18n.t('npc.maya_tech.choices.golem') }] : []),
      ...(canUpgrade
        ? [{ name: 'upgrade_golem', message: i18n.t('npc.maya_tech.choices.upgrade') }]
        : [
            {
              name: 'upgrade_golem',
              message: i18n.t('npc.maya_tech.choices.upgrade_lock', { amount: this.factionContribution }),
              disabled: true,
            },
          ]),
    ]
  }

  hasQuest(context: AppContext) {
    return MayaService.getActiveQuest(context) !== null
  }

  async handle(action: string, context: AppContext) {
    const goodsId = this.factionContribution > 100 ? 'resistance_better_shop' : 'resistance_shop'
    const buyScripts = i18n.t('npc.maya_tech.buy', { returnObjects: true }) as ShopScripts
    const sellScripts = i18n.t('npc.maya_tech.sell', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'join':
        await MayaActions.handleJoin(context)
        return true
      case 'talk':
        this.handleTalk()
        return true
      case 'buy':
        await this.openBuyShop(goodsId, buyScripts, context)
        return true
      case 'sell':
        await this.openSellShop(sellScripts, context.player)
        return true
      case 'golem':
        await MayaActions.handleAwakeGolem(context.player, this)
        return true
      case 'upgrade_golem':
        await MayaActions.handleUpgradeGolem(context.player)
        return true
      default:
        return true
    }
  }

  async afterDead(context: AppContext) {
    
  }
}
