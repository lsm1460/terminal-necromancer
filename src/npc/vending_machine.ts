import enquirer from 'enquirer'
import { Player } from '../core/Player'
import { GameContext, NPC } from '../types'
import { NPCHandler } from './NPCHandler'

const VendingMachineHandler: NPCHandler = {
  getChoices(player, npc, context) {

    return [
      { name: 'buy', message: '💰 아이템 구매' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'buy':
        await handleBuy(player, npc, context)
        break
      default:
        break
    }
  },
}

// --- 서브 메뉴: 물건 구매 ---
async function handleBuy(player: Player, npc: NPC, context: GameContext) {
  const { drop, npcs } = context
  const { drops: goods } = drop.generateDrops('potion_goods')

  if (goods.length === 0) {
    console.log(`\n[${npc.name}]: "잔액이 부족합니다."`)
    return
  }

  const contribution = (npc as any).contribution || 0
  const discountRate = Math.min(0.3, contribution * 0.001)

  const choices = goods.map((item) => {
    const finalPrice = Math.floor(item.price * (1 - discountRate))
    return {
      name: item.id,
      message: `${item.label.padEnd(10)} | 💰 ${finalPrice}G | ${item.description}`,
      label: item.label,
      price: finalPrice,
    }
  })

  choices.push({ name: 'cancel', message: '🔙 돌아가기', label: '취소', price: 0 })

  console.log('\n[자판기]: "상품을 선택해 주세요."')

  while (true) {
    const { itemId } = await enquirer.prompt<{ itemId: string }>({
      type: 'select',
      name: 'itemId',
      message: `[소지금: ${player.gold}G / 기여도: ${contribution}] 구매할 물건 선택`,
      choices: choices,
      format(value) {
        const selected = choices.find((c) => c.name === value)
        return selected ? selected.label : ''
      },
    })

    if (itemId === 'cancel') return

    const selectedChoice = choices.find((c) => c.name === itemId)
    if (!selectedChoice) return

    if (player.gold < selectedChoice.price) {
      console.log(`\n[${npc.name}]: "잔액이 부족합니다."`)
      return
    } else {
      player.gold -= selectedChoice.price

      const actualItem = goods.find((d) => d.id === itemId)

      npcs.updateFactionHostility(npc.faction, -1)
      npcs.updateFactionContribution(npc.faction, 5)

      if (actualItem) {
        player.addItem(actualItem)
        console.log(`\n✨ [구매 완료] ${selectedChoice.label}을(를) 구매했습니다! (-${selectedChoice.price}G)`)
      }
    }
  }
}

export default VendingMachineHandler
