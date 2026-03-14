import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { delay } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const FlintHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_flint')

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
        return await handleEvent(npc, player, context)
      default:
        break
    }
  },
}

async function handleEvent(flint: NPC, player: Player, context: GameContext) {
  const { battle, map, drop } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  const descColor = '\x1b[36m' // 환경 묘사 (Cyan)

  // --- [STAGE 1: 환경 묘사 및 독백] ---
  const initialScript = [
    { text: '벽면 전체를 채운 디지털 캔버스에서 추상적인 기하학 무늬가 일렁입니다.', delay: 1500 },
    { text: '그 빛이 주변의 모든 것을 기괴한 색으로 물들입니다.', delay: 1800 },
    { name: 'Flint', text: '(캔버스에서 뿜어져 나오는 보랏빛 광채에 얼굴이 일그러집니다.)', delay: 1200 },
    {
      name: 'Flint',
      text: '역겹군. 저 아래 구역에선 전등 하나가 아쉬워 사람들이 어둠 속에서 죽어가는데...',
      delay: 2000,
    },
    { name: 'Flint', text: "여기는 고작 이딴 '예술'을 한답시고 도시 절반의 전기를 끌어다 쓰고 있나.", delay: 1800 },
    { name: 'Flint', text: '(바닥에 뱉은 침이 형광색 빛을 받아 기묘하게 반짝입니다.)', delay: 1400 },
    { name: 'Flint', text: '이 벽을 부숴버리면, 그제야 이 놈들도 자기들 손이 얼마나 더러운지 보이겠지.', delay: 2000 },
    { name: 'Flint', text: '...누구냐. 거기서 쥐새끼처럼 훔쳐보지 말고 기어 나와.', delay: 1500 },
  ]

  for (const line of initialScript) {
    await delay(line.delay)
    if (!line.name) {
      Terminal.log(`  ${descColor}${line.text}\x1b[0m`)
    } else {
      Terminal.log(`플린트: "${line.text}"`)
    }
  }

  // --- [STAGE 2: 첫 번째 분기 - 기습 vs 대화] ---
  const mainChoice = await Terminal.select('당신의 행동을 선택하십시오:', [
    { name: 'ask_situation', message: '여기서 대체 무슨 일이 벌어지고 있는거야.' },
    { name: 'surprise_attack', message: '(기습: 빈틈을 노려 플린트를 공격한다.)' },
  ])

  if (mainChoice === 'surprise_attack') {
    // [기습 루트]
    Terminal.log(`  \x1b[31m[You] (대답 대신 무기를 꺼내 플린트의 빈틈을 노리고 달려듭니다!)\x1b[0m`)
    await delay(1000)
    Terminal.log(`플린트: "하! 쥐새끼가 이빨을 드러내는군. 네 놈 시체는 협상 테이블에 올릴 가치도 없겠어. 죽어라!"`)

    const isWin = await battle.runCombatLoop([battle.toCombatUnit(flint, 'npc')], context)

    if (isWin) {
      flint.updateHostility(40)
    } else {
      flint.updateHostility(10)
    }

    tile.isClear = true
    return true
  } else if (mainChoice === 'ask_situation') {
    // [대화 루트: 인질 계획 노출]
    Terminal.log(
      `플린트: "우린 이 층에 있는 '귀하신 몸'들을 전부 생포할 거다.\n놈들의 목줄을 쥐고 있어야 사신 놈과 협상이라도 해볼 수 있지 않겠어."`
    )
    await delay(1000)
    Terminal.log(
      `플린트: "자, 선택해. 우리와 함께 이 '인질 사냥'에 동참할 건가, 아니면 저 쓰레기들과 함께 역사 속으로 사라질 건가?"`
    )

    // --- [STAGE 3: 두 번째 분기 - 합류 vs 거절] ---
    const finalDecision = await Terminal.select('플린트의 제안에 어떻게 답하시겠습니까?', [
      { name: 'join', message: '협상 카드는 확실해야지. 돕겠다. (합류)' },
      { name: 'refuse', message: '무고한 사람들을 인질로 삼는 건 용납 못 한다. (거절)' },
    ])

    if (finalDecision === 'join') {
      // [합류 결과]
      Terminal.log(
        `플린트: "흐흐, 역시 뭘 좀 아는 놈이군. 자, 이건 선금이다. VIP 놈들 보관함에서 털어온 '대형 포션'이지."`
      )

      const { drops: goods } = drop.generateDrops('b5_flint_medical_kit')

      flint.updateContribution(25)
      player.addItem(goods[0])
      player.karma += 5
    } else {
      // [거절 결과]
      Terminal.log(
        `플린트: "무고한 사람? 하! 이 위층에서 호의호식하는 놈들 중에 손이 깨끗한 놈은 없어. 네 놈의 그 멍청한 도덕심이 널 죽이게 될 거다."`
      )

      flint.updateContribution(-20)
      flint.updateHostility(30)
    }
  }

  context.events.completeEvent('b5_flint_meeting_complete')
}

export default FlintHandler
