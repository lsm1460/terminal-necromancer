import i18n from '~/i18n'
import { GameContext } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const AdrianHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_adrian')

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    } else {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
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
    '(데스크 밑에서 덜덜 떨리는 숨소리가 들려옵니다...)',
    '에이드리언: 아... 안돼, 오지 마세요... 제발... 예약 명단에 없는 분은 출입 금지입니다...',
    '에이드리언: VIP 라운지는 현재... 히윽, 폭발 사고로 인해 임시 휴업 중이라니까요!',
    '에이드리언: 방금 그 소리 들으셨나요? 레지스탕스 놈들이 기어코 복도 끝까지 온 모양이에요.',
    '에이드리언: 제 구두... 한정판이었는데, 피가 묻어서 지워지질 않아요. 이게 대체 무슨 난리람...',
    '에이드리언: 보안팀은 대체 뭘 하는 거죠? 월급만 축내고... 아, 맞다. 아까 전부 사살당했지.',
    '에이드리언: 거기 누구 계신가요? 제발... 저 좀 여기서 꺼내주세요. 아니, 그냥 모른 척 지나가 주세요!',
    '에이드리언: 살려주세요... 아직 이번 달 정산도 다 못 끝냈단 말입니다... 으흐흑...',
  ]

  await speak(dialogues)

  context.events.completeEvent('b5_adrian')
}

export default AdrianHandler
