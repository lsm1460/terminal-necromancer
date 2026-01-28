import { handleBuy, handleSell, NPCHandler } from './NPCHandler'

const VendingMachineHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'buy', message: '💰 아이템 구매' },
      { name: 'sell', message: '📦 아이템 판매' },
    ]
  },
  async handle(action, player, npc, context) {
    const vendingMachineScripts = {
      buy: {
        greeting: '치익... 시스템 가동 중. 원하시는 상품 번호를 입력하십시오.',
        noStock: '에러: 해당 품목의 재고가 소진되었습니다. 보급 대기 중...',
        noGold: '잔액이 부족합니다. 투입구를 확인하고 추가 자산을 충전하십시오.',
        success: '결제 승인 완료. 상품 배출구에서 물건을 수거하십시오. 덜컹-',
      },
      sell: {
        // 보통 자판기는 물건을 사지 않지만, '자산 회수기' 컨셉으로 리팩토링한 handleSell을 쓸 수 있습니다.
        greeting: '자산 회수 모드 활성화. 스캔 장치에 물품을 투입하십시오.',
        noItems: '스캔 실패: 유효한 자산이 감지되지 않았습니다. 인벤토리 비어있음.',
        success: '물품 분석 완료. 가치 산정 결과가 계좌로 즉시 이체되었습니다.',
        exit: '치...지직... 거래 세션을 종료합니다. 이용해 주셔서 감사합니다.',
      },
    }

    switch (action) {
      case 'buy':
        await handleBuy(player, npc, context, 'potion_goods', vendingMachineScripts.buy)
        break
      case 'sell':
        await handleSell(player, npc, context, vendingMachineScripts.sell)
        break
      default:
        break
    }
  },
}

export default VendingMachineHandler
