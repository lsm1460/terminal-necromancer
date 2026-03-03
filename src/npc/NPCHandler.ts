import enquirer from 'enquirer'
import { Logger } from '~/core/Logger'
import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'
import { makeItemMessage } from '~/utils'

export interface NPCHandler {
  getChoices(player: Player, npc: NPC, context: GameContext): { name: string; message: string }[]
  handle(action: string, player: Player, npc: NPC, context: GameContext): Promise<boolean | void>
}

export async function handleTalk(npc: NPC) {
  if (!npc.lines || npc.lines.length === 0) {
    Logger.log(`\n💬 [${npc.name}]: ...`)
    return
  }

  const randomIndex = Math.floor(Math.random() * npc.lines.length)
  const selectedLine = npc.lines[randomIndex]

  Logger.log(`\n💬 [${npc.name}]: "${selectedLine}"`)
}

interface NPCWithContribution extends NPC {
  contribution?: number
}

interface ShopScripts {
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
    Logger.log(`\n[${npc.name}]: "${scripts.noStock}"`)
    return
  }

  // 2. 기여도 및 할인율 계산
  const contribution = npc.contribution ?? 0
  const discountRate = Math.min(0.3, contribution * 0.001)

  const choices = goods.map((item) => {
    let rarityMultiplier = 1

    switch (item.rarity) {
      case 'COMMON':
        rarityMultiplier = 1.0
        break
      case 'RARE':
        rarityMultiplier = 1.5
        break
      case 'EPIC':
        rarityMultiplier = 2.5
        break
      default:
        rarityMultiplier = 1.0
    }

    const finalPrice = Math.floor(item.price * rarityMultiplier * (1 - discountRate))

    return {
      name: item.id,
      message: makeItemMessage(item, player, { withPrice: true }),
      label: item.label,
      price: finalPrice,
    }
  })

  choices.push({ name: 'cancel', message: '🔙 돌아가기', label: '취소', price: 0 })

  Logger.log(`\n[${npc.name}]: "${scripts.greeting}"`)

  while (true) {
    const infoHeader = `[소지금: ${player.gold}G${npc.contribution !== undefined ? ` / 기여도: ${contribution}` : ''}]`

    const { itemId } = await enquirer.prompt<{ itemId: string }>({
      type: 'select',
      name: 'itemId',
      message: `${infoHeader} 구매할 물건 선택`,
      choices: choices,
      format(value) {
        const selected = choices.find((c) => c.name === value)
        return selected ? selected.label : ''
      },
    })

    if (itemId === 'cancel') {
      if (scripts.exit) Logger.log(`\n[${npc.name}]: "${scripts.exit}"`)
      return
    }

    const selectedChoice = choices.find((c) => c.name === itemId)
    if (!selectedChoice) return

    // 3. 소지금 체크
    if (player.gold < selectedChoice.price) {
      Logger.log(`\n[${npc.name}]: "${scripts.noGold}"`)
      continue
    }

    // 4. 결제 및 아이템 지급
    player.gold -= selectedChoice.price
    const actualItem = goods.find((d) => d.id === itemId)

    if (npc.faction) {
      npcs.updateFactionHostility(npc.faction, -1)
      npcs.updateFactionContribution(npc.faction, 5)
    }

    if (actualItem) {
      player.addItem(actualItem)
      const successMsg = scripts.success || `${selectedChoice.label}을(를) 구매했습니다.`
      Logger.log(`\n✨ [${npc.name}]: "${successMsg}" (-${selectedChoice.price}G)`)
    }
  }
}

export async function handleSell(player: Player, npc: NPC, context: GameContext, scripts: ShopScripts) {
  let totalEarnedInSession = 0

  Logger.log(`\n[${npc.name}]: "${scripts.greeting}"`)

  while (true) {
    // 2. 인벤토리 상태 확인
    if (player.inventory.length === 0) {
      Logger.log(`\n[${npc.name}]: "${scripts.noItems}"`)
      break
    }

    const contribution = npc.factionContribution ?? 0
    const hasContribution = npc.factionContribution !== undefined
    const bonusRate = Math.min(0.2, contribution * 0.0005) // 최대 20% 보너스

    const choices = player.inventory.map((item, index) => {
      const finalSellPrice = Math.floor((item.sellPrice || 0) * (1 + bonusRate))

      return {
        name: `${index}`,
        id: item.id,
        message: makeItemMessage(item, player, { withPrice: true, isSell: true }),
        label: item.label,
        price: finalSellPrice,
        originalIndex: index,
      }
    })

    choices.push({ name: 'cancel', id: '', message: '🔙 돌아가기', label: '취소', price: 0, originalIndex: -1 })

    const bonusInfo = hasContribution ? ` / 보너스: +${(bonusRate * 100).toFixed(1)}%` : ''

    const { choiceName } = await enquirer.prompt<{ choiceName: string }>({
      type: 'select',
      name: 'choiceName',
      message: `[소지금: ${player.gold}G${bonusInfo}] 판매할 물건 선택`,
      choices,
      format(value) {
        const selected = choices.find((c) => c.name === value)
        return selected ? selected.label : ''
      },
    })

    if (choiceName === 'cancel') break

    const selected = choices.find((c) => c.name === choiceName)!
    const targetItem = player.inventory[selected.originalIndex]

    let sellCount = 1
    if (targetItem.quantity && targetItem.quantity > 1) {
      const { count } = await enquirer.prompt<{ count: number }>({
        type: 'numeral',
        name: 'count',
        message: `몇 개를 파시겠습니까? (1~${targetItem.quantity})`,
        initial: 1,
        validate: (val) => {
          const quantity = Number(val)
          return quantity > 0 && quantity <= targetItem.quantity! ? true : '수량이 올바르지 않습니다.'
        },
      })
      sellCount = count
    }

    const totalEarned = selected.price * sellCount
    player.gold += totalEarned
    totalEarnedInSession += totalEarned

    player.removeItem(selected.id, sellCount)

    if (npc.faction) {
      context.npcs.updateFactionHostility(npc.faction, -1)
      context.npcs.updateFactionContribution(npc.faction, 10)
    }

    Logger.log(`\n💰 [${npc.name}]: "${scripts.success}" (+${totalEarned}G)`)
  }

  // 6. 거래 종료 보고
  if (totalEarnedInSession > 0) {
    Logger.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Logger.log(` 🧾 영수증: 이번 거래로 총 ${totalEarnedInSession}G를 벌었습니다.`)
    Logger.log(` 💰 현재 소지금: ${player.gold}G`)
    Logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  }

  scripts.exit && Logger.log(`\n[${npc.name}]: "${scripts.exit}"`)
}
