import { Player } from '../core/Player'
import { GameContext, NPC } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'
import enquirer from 'enquirer'

const MayaHandler: NPCHandler = {
  getChoices(npc, context) {
    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'buy', message: '💰 아이템 구매' },
      { name: 'sell', message: '📦 아이템 판매' },
      { name: 'upgrade_golem', message: '🤖 골렘 강화' },
      { name: 'modify_darknight', message: '⚔️ 다크나이트 장비 변경' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'buy':
        await handleBuy(player, npc, context)
        break
      case 'sell':
        await handleSell(player, npc, context)
        // TODO: 판매 창 로직 호출
        break
      case 'upgrade_golem':
        console.log('\n[마야]: "골렘의 엔진을 손볼 생각이야?"')
        // TODO: 골렘 강화 UI 호출
        break
      case 'modify_darknight':
        console.log('\n[마야]: "다크나이트의 무장 상태를 변경할게."')
        // TODO: 다크나이트 장비 관리 호출
        break
      default:
        break
    }
  },
}

// --- 서브 메뉴: 물건 구매 ---
async function handleBuy(player: Player, npc: NPC, context: GameContext) {
  const { drop, npcs } = context
  const { drops: goods } = drop.generateDrops('maya_shop')

  if (goods.length === 0) {
    console.log(`\n[${npc.name}]: "미안하지만 지금은 재고가 하나도 없어."`)
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

  console.log('\n[마야]: "쓸만한 물건들이 좀 있어. 골라봐."')

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
      console.log(`\n[${npc.name}]: "돈이 부족하잖아. 고철이라도 더 주워오라고."`)
      return
    } else {
      player.gold -= selectedChoice.price

      const actualItem = goods.find((d) => d.id === itemId)

      npcs.updateFactionHostility(npc.faction, -1)
      npcs.updateFactionContribution(npc.faction, 10)

      if (actualItem) {
        player.addItem(actualItem)
        console.log(`\n✨ [구매 완료] ${selectedChoice.label}을(를) 구매했습니다! (-${selectedChoice.price}G)`)
      }
    }
  }
}

async function handleSell(player: Player, npc: NPC, context: GameContext) {
  let totalEarnedInSession = 0 // 이번 방문 총 수익 저장

  while (true) {
    if (player.inventory.length === 0) {
      console.log(`\n[${npc.name}]: "더 이상 팔 물건이 없나 보군."`)
      break
    }

    const contribution = npc.factionContribution || 0
    const bonusRate = Math.min(0.2, contribution * 0.0005)

    const choices = player.inventory.map((item, index) => {
      const finalSellPrice = Math.floor(item.sellPrice * (1 + bonusRate))
      return {
        name: `${index}`,
        message: `${item.label.padEnd(10)} | 💰 개당 +${finalSellPrice}G | 보유: ${item.quantity}개`,
        label: item.label,
        price: finalSellPrice,
        originalIndex: index,
      }
    })

    choices.push({ name: 'cancel', message: '🔙 돌아가기', label: '취소', price: 0, originalIndex: -1 })

    const { choiceName } = await enquirer.prompt<{ choiceName: string }>({
      type: 'select',
      name: 'choiceName',
      message: `[소지금: ${player.gold}G / 보너스: +${(bonusRate * 100).toFixed(1)}%] 판매할 물건 선택`,
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

    // quantity가 옵셔널하므로 안전하게 처리
    if (targetItem.quantity) {
      targetItem.quantity -= sellCount
      // 수량이 0 이하가 되면 제거
      if (targetItem.quantity <= 0) {
        player.inventory.splice(selected.originalIndex, 1)
      }
    } else {
      // quantity 필드가 아예 없는 아이템은 '1개만 존재하는 아이템'으로 간주하여 즉시 제거
      player.inventory.splice(selected.originalIndex, 1)
    }

    console.log(`\n💰 [판매 완료] ${selected.label} x${sellCount}개를 판매했습니다! (+${totalEarned}G)`)
  }

  // 루프 종료 후 총 수익 보고
  if (totalEarnedInSession > 0) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(` 🧾 이번 거래로 총 ${totalEarnedInSession}G를 벌었습니다.`)
    console.log(` 💰 현재 소지금: ${player.gold}G`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  }
}

export default MayaHandler
