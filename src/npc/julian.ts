import { GameContext } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const JulianHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_julian')

    if (alreadyTalk) {
      return [{ name: 'talk', message: '💬 잡담' }]
    } else {
      return [{ name: 'event', message: '🔍 살펴보기' }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        await handleEvent(context)
        break
      default:
        break
    }
  },
}

async function handleEvent(context: GameContext) {
  const dialogues = [
    '결국 이렇게 될 줄 알았습니다. 상층부 멍청이들이 경고를 무시할 때부터 알아봤어야 했어!',
    '(깨진 크리스탈 잔 조각들을 신경질적으로 밀어내며) 이 비싼 술들이 피 냄새와 섞이는군요. 정말 최악의 마리아주(Mariage)입니다.',
    '레지스탕스? 그들이 올 거라는 건 바닥권 소식통만 봐도 뻔한 일이었죠. 나 같은 바텐더도 아는 걸 보안팀만 몰랐다니!',
    '어서 여길 떠나세요. 곧 이 VIP 룸의 화려한 조명들이 지옥의 불꽃으로 바뀔 테니까요.',
    '제길, 내 최고급 셰이커가 어디 갔지? 이 난장판 속에서... 정돈된 건 이제 아무것도 없군!',
  ]

  await speak(dialogues)

  context.events.completeEvent('b5_julian')
}

export default JulianHandler
