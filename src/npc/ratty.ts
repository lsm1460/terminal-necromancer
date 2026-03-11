import { GameContext } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const RattyHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b2_ratty')

    if (alreadyTalk) {
      return [{ name: 'talk', message: '💬 잡담' }]
    } else {
      return [{ name: 'threat', message: '💬 잡담' }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'threat':
        await handleThreat(context)
        break
      default:
        break
    }
  },
}

async function handleThreat(context: GameContext) {
  const dialogues = [
    '래티: "히히... 야, 거기 너. 그래, 너 말이야. 뭐 대단한 군대를 호령하던 놈이라며?"',
    '래티: "군대는 커녕 당장 네 코앞에 들이닥칠 쥐새끼 한 마리도 못 잡아서 쩔쩔매게 생겼는데?\n꼴을 좀 봐, 그 넝마 같은 옷이 제법 잘 어울려."',
    '래티: "예전에는 좀 잘 나갔을지 몰라도, 여기선 네놈이 부리던 노예보다 못한 처지라고.\n알아? 사신 놈 앞바닥이나 핥으면서 연명하는 꼬락서니가 참 볼만해."',
    '래티: "왜? 눈빛이 왜 그래? 한 대 치게? 히히히! 쳐봐, 쳐보라고! 네 그 힘 빠진 손으로 뭘 할 수 있는데?"',
    '래티: "아니면 무릎이라도 꿇고 빌어보던가. 그럼 내 전성기 시절 비법이라도 하나 전수해 줄지 누가 알아?"',
  ]

  await speak(dialogues)

  context.events.completeEvent('b2_ratty')
}

export default RattyHandler
