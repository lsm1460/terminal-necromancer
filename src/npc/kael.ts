import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const KaelHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_child_resistance_encounter')

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
        return await handleChildResistanceDiscovery(player, npc, context)
      default:
        break
    }
  },
}

export async function handleChildResistanceDiscovery(player: Player, npc: NPC, context: GameContext) {
  const { battle, map, npcs, events } = context

  const tile = map.getTile(player.pos.x, player.pos.y)

  const battleWith = async () => {
    const kael = npcs.getNPC('kael')
    const vesper = npcs.getNPC('vesper')

    const kUnit = battle.toCombatUnit(kael!, 'npc')
    const vUnit = battle.toCombatUnit(vesper!, 'npc')
    const isWin = await battle.runCombatLoop([kUnit, vUnit], context)

    if (isWin) {
      npc.updateHostility(40)
    } else {
      npc.updateHostility(10)
    }

    events.completeEvent('b5_child_resistance_encounter')

    tile.isClear = true
    return true
  }

  const dialogue = [
    '베스퍼: 이것 좀 봐, 카엘. 이 방은 우리 수용소 전체보다 넓은 것 같아.',
    '카엘: 한눈팔지 마, 베스퍼. 여긴 아직 안전하지 않아. 플린트 형님이 쥐새끼 한 마리도 놓치지 말랬잖아.',
    '베스퍼: 치, 알았어. 근데 말이야... 여기 사람들은 왜 이렇게까지 많은 걸 가지고도 더 가지려 했을까?',
    '카엘: (금방이라도 부서질 듯한 화려한 장식장을 만지며) ...글쎄. 하지만 이제 공평해졌지. 곧 여기도 우리 집처럼 잿더미가 될 테니까.',
    '베스퍼: (당신을 발견하고 소형 석궁을 겨누며) 잠깐! 거기 누구야? VIP 놈들 중 하나인가?',
  ]

  await speak(dialogue)

  // --- [STAGE 2: 플레이어의 대응 선택] ---
  const choice = await Terminal.select('어떻게 대응하시겠습니까?', [
    { name: 'flint_friend', message: `"난 너희의 동료다." (레지스탕스 우호도 확인)` },
    { name: 'intimidate', message: `"애송이들은 비켜라. 다치기 싫으면."` },
  ])

  // --- [STAGE 3: 결과 분기] ---
  switch (choice) {
    case 'flint_friend':
      if (npc.factionContribution >= 20) {
        const dialogue = [
          "카엘: 플린트 형님이 말한 '쓸만한 녀석'이 당신이었군. 무례하게 굴어서 미안해. 베스퍼, 무기 내려.",
          '베스퍼: 흥, 형님이 아니었으면 벌써 구멍이 났을 줄 알아! 운 좋은 줄 알라고.',
        ]

        await speak(dialogue)
      } else {
        const dialogue = [
          '카엘: 거짓말 마. 형님은 너 같은 사람에 대해 말한 적 없어. 수상한 놈은 여기서 제거한다.',
          '베스퍼: 들켰네? 잘 가, 거짓말쟁이 아저씨!',
        ]

        await speak(dialogue)

        return await battleWith()
      }
      break

    case 'intimidate':
      const dialogue = [
        '카엘: 우릴 애 취급하는 놈들이 어떻게 죽었는지 보여주지. 베스퍼, 저격 준비!',
        '베스퍼: 이미 조준 끝났어! 구멍 날 준비나 해!',
      ]

      await speak(dialogue)

      return await battleWith()
  }

  events.completeEvent('b5_child_resistance_encounter')
}

export default KaelHandler
