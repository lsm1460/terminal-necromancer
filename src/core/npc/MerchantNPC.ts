// src/core/npc/MerchantNPC.ts
import i18n from '~/i18n'
import { GameContext } from '~/types'
import { Item } from '../item/Item'
import { Player } from '../player/Player'
import { Terminal } from '../Terminal'
import { BaseNPC } from './BaseNPC'
import { ShopService } from './ShopService'

export interface ShopScripts {
  greeting?: string // 판매 메뉴 진입 시
  noItems?: string // 인벤토리가 비어있을 때
  success: string // 판매 성공 시 (개별 건)
  exit?: string // 판매 종료 후 나갈 때
  noStock?: string
  noGold?: string
}

export abstract class MerchantNPC extends BaseNPC {
  protected async openBuyShop(dropTableId: string, scripts: ShopScripts, context: GameContext) {
    const { player, drop } = context
    const { drops: goods } = drop.generateDrops(dropTableId)

    if (goods.length === 0) {
      Terminal.log(`\n[${this.name}]: "${scripts.noStock}"`)
      return
    }

    const discountRate = ShopService.calculateDiscountRate(this.factionContribution)
    const choices: { name: string; message: string; price: number }[] = goods.map((item) => {
      const multiplier = ShopService.getRarityMultiplier(item.rarity)
      const finalPrice = Math.floor(item.price * multiplier * (1 - discountRate))

      return {
        name: item.id,
        message: Item.makeItemMessage(item, player, { withPrice: true }),
        price: finalPrice,
      }
    })

    choices.push({ name: 'cancel', message: i18n.t('cancel'), price: 0 })
    Terminal.log(`\n[${this.name}]: "${scripts.greeting}"`)

    while (true) {
      const infoHeader = i18n.t('npc.buy.info_header', {
        gold: player.gold,
        contribution:
          this.factionContribution !== undefined
            ? i18n.t('npc.buy.contribution_label', { value: this.factionContribution })
            : '',
      })

      const itemId = await Terminal.select(`${infoHeader} ${i18n.t('npc.buy.select_item')}`, choices)
      if (itemId === 'cancel') {
        if (scripts.exit) Terminal.log(`\n[${this.name}]: "${scripts.exit}"`)
        break
      }

      const selected = choices.find((c) => c.name === itemId)
      if (!selected) continue

      if (player.gold < selected.price!) {
        Terminal.log(`\n[${this.name}]: "${scripts.noGold}"`)
        continue
      }

      // 결제 처리
      player.gold -= selected.price!
      const actualItem = goods.find((d) => d.id === itemId)

      if (this.faction) {
        this.updateHostility(-1)
        this.updateContribution(5)
      }

      if (actualItem) {
        player.addItem(actualItem)
        Terminal.log(`\n✨ [${this.name}]: "${scripts.success}" (-${selected.price}G)`)
      }
    }
  }

  /** 상점 판매 실행 */
  protected async openSellShop(scripts: ShopScripts, player: Player) {
    let totalEarned = 0
    Terminal.log(`\n[${this.name}]: "${scripts.greeting}"`)

    while (true) {
      if (player.inventory.length === 0) {
        Terminal.log(`\n[${this.name}]: "${scripts.noItems}"`)
        break
      }

      const bonusRate = ShopService.calculateSellBonusRate(this.factionContribution)
      const choices = player.inventory.map((item, index) => ({
        name: `${index}`,
        id: item.id,
        message: Item.makeItemMessage(item, player, { withPrice: true, isSell: true }),
        price: Math.floor((item.sellPrice || 0) * (1 + bonusRate)),
        originalIndex: index,
      }))

      choices.push({ name: 'cancel', message: i18n.t('cancel') } as any)

      const choiceName = await Terminal.select(i18n.t('npc.sell.info_header', { gold: player.gold }), choices)
      if (choiceName === 'cancel') break

      const selected = choices.find((c) => c.name === choiceName)!
      const amount = selected.price!

      player.gold += amount
      totalEarned += amount
      player.removeItem(selected.id!, 1)

      if (this.faction) {
        this.updateHostility(-1)
        this.updateContribution(10)
      }

      Terminal.log(`\n💰 [${this.name}]: "${scripts.success}" (+${amount}G)`)
    }

    if (totalEarned > 0) {
      Terminal.log(`\n━━━━━━━━━ [ 영수증 ] ━━━━━━━━━`)
      Terminal.log(i18n.t('npc.sell.receipt.total', { earned: totalEarned }))
      Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    }
  }
}
