import { handleBuy, handleSell, NPCHandler } from './NPCHandler'

const VendingMachineHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [{ name: 'buy', message: '💰 아이템 구매' }]
  },
  async handle(action, player, npc, context) {
    const vendingMachineScripts = {
      buy: {
        greeting: '치익... 시스템 가동 중. 원하시는 상품 번호를 입력하십시오.',
        noStock: '에러: 해당 품목의 재고가 소진되었습니다. 보급 대기 중...',
        noGold: '잔액이 부족합니다. 투입구를 확인하고 추가 자산을 충전하십시오.',
        success: '결제 승인 완료. 상품 배출구에서 물건을 수거하십시오. 덜컹-',
      },
    }

    switch (action) {
      case 'buy':
        await handleBuy(player, npc, context, 'potion_goods', vendingMachineScripts.buy)
        break
      default:
        break
    }
  },
}

export default VendingMachineHandler
