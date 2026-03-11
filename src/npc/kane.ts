import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const KaneHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isJoined = context.events.isCompleted('RESISTANCE_BASE')
    const isAlreadyMet = context.events.isCompleted('kane_1')

    if (isJoined && !isAlreadyMet) {
      return [{ name: 'join', message: '💬 대화' }]
    }

    return [{ name: 'talk', message: '💬 잡담' }]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'join':
        await handleJoin(player, npc, context)
        break
      case 'talk':
        handleTalk(npc)
        break
      default:
        break
    }
  },
}

async function handleJoin(player: Player, npc: NPC, context: GameContext) {
  const { npcs, events } = context

  const jax = npcs.getNPC('jax_seeker');
  const jaxIsAlive = jax?.isAlive;

  const dialogues = [
    '???: "발소리가 무겁군. 사신의 사슬에 묶여 영혼의 무게를 잊어버린 자의 발소리야."',
    '케인: "...내 이름은 케인. 이 무너져가는 터미널의 구석에서, 아직 \'의지\'를 잃지 않은 자들의 대장이지."',
  ];

  // 1. 잭스 상태에 따른 분기 (정찰꾼 안위 확인)
  if (!jaxIsAlive) {
    dialogues.push(
      '케인: "(날카로운 눈빛으로 당신을 쏘아보며) 신참, 네놈은 어디서 오는 길인가? 이곳은 내 정찰꾼 잭스가 조사하러 나간 구역이다."',
      '케인: "그런데 어째서 네놈 같은 사신의 수하가 무사히 여길 기어 들어온 거지? ...혹시 잭스를 보았나? 설마 그 녀석, 사신놈들에게 당한 건 아니겠지?"'
    );
  } else {
    dialogues.push(
      '케인: "잭스에게 이야기는 들었다. 정찰을 나갔던 그 녀석이 용케 살아서 돌아온 모양이더군."',
      '케인: "그 녀석은 잘 있나? 워낙 발이 빨라 걱정은 안 한다만,\n사신의 마력이 짙게 깔린 이 구역은 잭스에게도 버거운 곳이었을 텐데."'
    );
  }

  // 2. 사신의 통치에 대한 폭로 및 제안
  dialogues.push(
    '케인: "사신은 이곳을 정화한다는 명목으로 환생의 흐름을 막고 있다.\n마땅히 빛으로 돌아가야 할 영혼들을 자신의 정원을 가꾸는 노예로 부리고 있단 말이다."',
    '케인: "비록 죄를 짓고 이곳에 왔을지라도, 영원히 부당한 노역에 시달려야 할 영혼은 없어.\n그건 공정이 아니라 그저 사신의 탐욕일 뿐이지."',
    '케인: "이봐, 신참. 사신이 시키는 대로 비굴하게 고개를 숙이며 영혼을 갉아먹힐 건가?\n아니면 우리와 함께 이 뒤틀린 체계를 무너뜨릴 건가?"',
    '케인: "선택은 네놈의 몫이다. 하지만 기억해라.\n사신의 개로 살다 버려지는 것보다, 인간으로서 저항하다 사라지는 것이 훨씬 가치 있다는 걸."'
  );

  await speak(dialogues)

  events.completeEvent('kane_1');
}

export default KaneHandler
