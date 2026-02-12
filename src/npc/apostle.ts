import { GameContext } from '../types'
import { delay } from '../utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const ApostleHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b3_apostle')

    if (alreadyTalk) {
      return [{ name: 'talk', message: '🔍 살펴보기' }]
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
        await handleThreat(context)
        break
      default:
        break
    }
  },
}

async function handleThreat(context: GameContext) {
  const script = [
    {
      text: "[지지직-] 아... 아... 하역장의 일꾼들이여!\n위대한 '사신'의 자비를 찬양... [Error] ...하라!",
      delay: 1200,
    },
    { text: '보십시오! 사신님은 빈손으로 이 터미널을... \n[치익-] ...피와 고철로 쌓아 올리셨습니다.', delay: 1500 },
    { text: '참으로... 성스러운 학살... 아니, 건설이었습니다!', delay: 1000 },
    {
      text: '이승과 저승을 잇는 이 찬란한 궤도는... [노이즈 가중]\n ...수많은 시체 위로 부드럽게 미끄러지듯 놓였습니다. 아름답지 않습니까?',
      delay: 1800,
    },
    { text: '땀은 배신하지 않습니다. 당신의 땀은 사신님의... \n[치익-] ...냉각수가 될 것이며,', delay: 1200 },
    { text: '당신의 뼈는 터미널의 기둥이 될 것입니다! \n영광인 줄... [비프음] ...알아야지!', delay: 1400 },
    {
      text: '[시스템 경고: 출력 임계치 초과] 일하십시오! \n죽음 너머의 제국은 바로... [치익-] ...당신의 무덤 위에 건설됩니다!',
      delay: 1800,
    },
    { text: '찬양... 찬양... 찬양하... [시스템 재부팅 중...]', delay: 2000 },
  ]

  console.log(`\n\x1b[90m[ 기괴한 소음을 이어집니다... ]\x1b[0m`)

  for (const line of script) {
    await delay(line.delay)

    // '📢'로 시작하는 문장은 선전용 스피커 톤(노란색), 나머지는 시스템 오류/본심(회색 기울임)
    const isBroadcast = line.text.startsWith('📢')
    const color = isBroadcast ? '\x1b[93m' : '\x1b[3m\x1b[90m'

    console.log(`  ${color}"${line.text}"\x1b[0m`)
  }

  context.events.completeEvent('b3_apostle')
}

export default ApostleHandler
