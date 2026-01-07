import { Player } from '../core/Player'
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
        console.log('\n[마야]: "쓸만한 물건들이 좀 있어. 골라봐."')
        handleBuy(player)
        // TODO: 상점 열기 로직 호출
        break
      case 'sell':
        console.log('\n[마야]: "고철이나 잡동사니는 언제든 환영이야."')
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

// --- 서브 메뉴: 스킬 전수 ---
async function handleBuy(player: Player) {
  
}

export default MayaHandler
