import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { getItemLabel, makeItemMessage } from '~/utils'

export interface NPCHandler {
  getChoices(player: Player, npc: NPC, context: GameContext): { name: string; message: string }[]
  handle(action: string, player: Player, npc: NPC, context: GameContext): Promise<boolean | void>
  hasQuest?(player: Player, npc: NPC, context: GameContext): boolean
}

export async function handleTalk(npc: NPC) {
  if (!npc.lines || npc.lines.length === 0) {
    Terminal.log(`\n💬 [${npc.name}]: ...`)
    return
  }

  const randomIndex = Math.floor(Math.random() * npc.lines.length)
  const selectedLine = npc.lines[randomIndex]

  Terminal.log(`\n💬 [${npc.name}]: "${selectedLine}"`)
}

interface NPCWithContribution extends NPC {
  contribution?: number
}

export interface ShopScripts {
  greeting?: string // 판매 메뉴 진입 시
  noItems?: string // 인벤토리가 비어있을 때
  success: string // 판매 성공 시 (개별 건)
  exit?: string // 판매 종료 후 나갈 때
  noStock?: string
  noGold?: string
}

export async function handleBuy(
  player: Player,
  npc: NPCWithContribution,
  context: GameContext,
  dropTableId: string,
  scripts: ShopScripts
) {
  const { drop, npcs } = context
  const { drops: goods } = drop.generateDrops(dropTableId)

  // 1. 재고 확인
  if (goods.length === 0) {
    Terminal.log(`\n[${npc.name}]: "${scripts.noStock}"`)
    return
  }

  // 2. 기여도 및 할인율 계산
  const contribution = npc.contribution ?? 0
  const discountRate = Math.min(0.3, contribution * 0.001)

  const choices: { name: string; message: string; label?: string; price?: number }[] = goods.map((item) => {
    let rarityMultiplier = 1

    switch (item.rarity) {
      case 'COMMON': rarityMultiplier = 1.0; break
      case 'RARE': rarityMultiplier = 1.5; break
      case 'EPIC': rarityMultiplier = 2.5; break
      default: rarityMultiplier = 1.0
    }

    const finalPrice = Math.floor(item.price * rarityMultiplier * (1 - discountRate))

    return {
      name: item.id,
      message: makeItemMessage(item, player, { withPrice: true }),
      label: getItemLabel(item),
      price: finalPrice,
    }
  })

  choices.push({ name: 'cancel', message: i18n.t('cancel') })

  Terminal.log(`\n[${npc.name}]: "${scripts.greeting}"`)

  while (true) {
    const contributionText = npc.contribution !== undefined 
      ? i18n.t('npc.buy.contribution_label', { value: contribution }) 
      : ''
    
    const infoHeader = i18n.t('npc.buy.info_header', { 
      gold: player.gold, 
      contribution: contributionText 
    })

    const itemId = await Terminal.select(`${infoHeader} ${i18n.t('npc.buy.select_item')}`, choices)

    if (itemId === 'cancel') {
      if (scripts.exit) Terminal.log(`\n[${npc.name}]: "${scripts.exit}"`)
      return
    }

    const selectedChoice = choices.find((c) => c.name === itemId)
    if (!selectedChoice) return

    // 3. 소지금 체크
    if (player.gold < selectedChoice.price!) {
      Terminal.log(`\n[${npc.name}]: "${scripts.noGold}"`)
      continue
    }

    // 4. 결제 및 아이템 지급
    player.gold -= selectedChoice.price!
    const actualItem = goods.find((d) => d.id === itemId)

    if (npc.faction) {
      npcs.updateFactionHostility(npc.faction, -1)
      npcs.updateFactionContribution(npc.faction, 5)
    }

    if (actualItem) {
      player.addItem(actualItem)
      const successMsg = scripts.success || i18n.t('npc.buy.success_default', { label: selectedChoice.label })
      
      Terminal.log(`\n✨ [${npc.name}]: "${successMsg}" (-${selectedChoice.price}G)`)
    }
  }
}

export async function handleSell(player: Player, npc: NPC, context: GameContext, scripts: ShopScripts) {
  let totalEarnedInSession = 0

  Terminal.log(`\n[${npc.name}]: "${scripts.greeting}"`)

  while (true) {
    if (player.inventory.length === 0) {
      Terminal.log(`\n[${npc.name}]: "${scripts.noItems}"`)
      break
    }

    const contribution = npc.factionContribution ?? 0
    const hasContribution = npc.factionContribution !== undefined
    const bonusRate = Math.min(0.2, contribution * 0.0005)

    const choices = player.inventory.map((item, index) => {
      const finalSellPrice = Math.floor((item.sellPrice || 0) * (1 + bonusRate))

      return {
        name: `${index}`,
        id: item.id,
        message: makeItemMessage(item, player, { withPrice: true, isSell: true }),
        label: getItemLabel(item),
        price: finalSellPrice,
        originalIndex: index,
      }
    })

    choices.push({ name: 'cancel', message: i18n.t('cancel') } as any)

    // 보너스 정보 다국어 처리
    const bonusInfo = hasContribution 
      ? i18n.t('npc.sell.bonus_label', { value: (bonusRate * 100).toFixed(1) }) 
      : ''

    const infoHeader = i18n.t('npc.sell.info_header', { gold: player.gold, bonus: bonusInfo })
    const choiceName = await Terminal.select(`${infoHeader} ${i18n.t('npc.sell.select_item')}`, choices)

    if (choiceName === 'cancel') break

    const selected = choices.find((c) => c.name === choiceName)!
    const targetItem = player.inventory[selected.originalIndex!]

    let sellCount = 1
    if (targetItem.quantity && targetItem.quantity > 1) {
      // TODO: Terminal에 numeral/text prompt 추가 필요. 일단 1로 고정
      Terminal.log(i18n.t('npc.sell.quantity_notice', { total: targetItem.quantity }))
      sellCount = 1
    }

    const totalEarned = selected.price! * sellCount
    player.gold += totalEarned
    totalEarnedInSession += totalEarned

    player.removeItem(selected.id!, sellCount)

    if (npc.faction) {
      context.npcs.updateFactionHostility(npc.faction, -1)
      context.npcs.updateFactionContribution(npc.faction, 10)
    }

    Terminal.log(`\n💰 [${npc.name}]: "${scripts.success}" (+${totalEarned}G)`)
  }

  // 거래 종료 보고 (영수증)
  if (totalEarnedInSession > 0) {
    Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Terminal.log(i18n.t('npc.sell.receipt.total', { earned: totalEarnedInSession }))
    Terminal.log(i18n.t('npc.sell.receipt.current_gold', { gold: player.gold }))
    Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  }

  scripts.exit && Terminal.log(`\n[${npc.name}]: "${scripts.exit}"`)
}
