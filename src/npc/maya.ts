import { Player } from '../core/Player'
import { GameContext, NPC } from '../types'
import { handleBuy, handleSell, handleTalk, NPCHandler } from './NPCHandler'

const MayaHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const canUpgrade = npc.factionContribution > 500 && context.events.isCompleted('second_boss')
    const canModify = npc.factionContribution > 800 && context.events.isCompleted('third_boss')

    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'buy', message: '💰 아이템 구매' },
      { name: 'sell', message: '📦 아이템 판매' },
      ...(canUpgrade ? [{ name: 'upgrade_golem', message: '🤖 골렘 강화' }] : []),
      ...(canModify ? [{ name: 'modify_darknight', message: '⚔️ 다크나이트 장비 변경' }] : []),
    ]
  },
  async handle(action, player, npc, context) {
    const mayaScripts = {
      buy: {
        greeting: '필요한 게 있다면 골라봐. 공짜는 없는 거 알지?',
        noStock: '재고가 다 떨어졌어. 나중에 다시 오라고.',
        noGold: '잔액이 모자라는데. 하역장에서 고철이라도 더 주워와.',
        success: '물건 확인해 봐. 쓸만할 거야.',
      },
      sell: {
        greeting: '주워온 것 좀 볼까? 쓸모없는 건 안 받아.',
        noItems: '주머니가 비었네. 더 팔 건 없는 거지?',
        success: '상태가 나쁘지 않군. 여기, 약속한 대가야.',
        exit: '살아남으라고. 죽으면 거래도 끝이니까.',
      },
    }

    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'buy':
        await handleBuy(player, npc, context, 'resistance_shop', mayaScripts.buy)
        break
      case 'sell':
        await handleSell(player, npc, context, mayaScripts.sell)
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

async function handleUpgrade(player: Player, npc: NPC, context: GameContext) {}

export default MayaHandler
