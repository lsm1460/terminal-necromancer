import { handleBuy, handleSell, NPCHandler } from './NPCHandler'

const MarcoHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'buy', message: '💰 아이템 구매' },
      { name: 'sell', message: '📦 아이템 판매' },
    ]
  },
  async handle(action, player, npc, context) {
    const marcoScripts = {
      buy: {
        greeting: '오, 어서 오게! 여기 있는 건 전부 내 손으로 직접 검수하고 정비한 특상품들이야. 한번 둘러보게나.',
        noStock: '아이고, 그건 방금 전 손님이 채갔어. 터미널 물량이 워낙 귀해서 말이야. 다른 건 어때?',
        noGold:
          '어이구, 손님... 주머니 사정이 좀 가벼운 모양인데? 내 물건이 좀 비싸긴 해도 제값은 하거든. 나중에 다시 오게.',
        success: '탁월한 선택이야! 아주 요긴하게 쓰일 걸세. 자, 여기 있네. 조심해서 가져가라고.',
      },
      sell: {
        greeting: '오호, 뭔가 쓸만한 걸 가져온 모양이군? 내가 또 가치 하나는 기막히게 알아보지. 어디 한번 보여줘 봐.',
        noItems: '자네, 나랑 장난하나? 주머니에 먼지밖에 없는데 뭘 보여주겠다는 건가. 제대로 챙겨서 다시 오라고.',
        success: '음... 상태가 나쁘지 않군. 좋아, 이 정도면 적당히 쳐주지. 여기 자네 몫일세. 짤랑-',
        exit: '벌써 가려고? 아쉽구먼. 대합실 구석에 항상 있으니, 필요한 게 생기면 언제든 또 들르게나.',
      },
    }

    switch (action) {
      case 'buy':
        await handleBuy(player, npc, context, 'potion_goods', marcoScripts.buy)
        break
      case 'sell':
        await handleSell(player, npc, context, marcoScripts.sell)
        break
      default:
        break
    }
  },
}

export default MarcoHandler
