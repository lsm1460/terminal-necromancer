import enquirer from 'enquirer'
import { MAP_IDS } from '~/consts'
import { Logger } from '~/core/Logger'
import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'
import { handleTalk, NPCHandler } from './NPCHandler'

const JaxHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isJoined = context.events.isCompleted('RESISTANCE_BASE')

    if (isJoined) {
      return [
        { name: 'talk', message: '💬 잡담' },
        { name: 'enter', message: '💬 본부로 이동' },
      ]
    } else {
      return [{ name: 'join', message: '💬 잡담' }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'enter':
        handleEnter(player, context)
        break
      case 'join':
        return await handleJoin(player, npc, context)
      default:
        break
    }
  },
}

async function handleJoin(player: Player, npc: NPC, context: GameContext) {
  const { map, npcs, events, battle } = context

  const tile = map.getTile(player.pos.x, player.pos.y)

  const dialogues = [
    '구석에서 기름때 묻은 누더기를 걸친 사내가 낡은 단검을 만지작거리며 나타납니다.',
    '잭스: "이봐, 못 보던 낯짝인데? 이 주변은 쥐새끼 한 마리도 내 허락 없인 못 지나다녀."',
    '잭스: "비실비실해 보이는 게... 딱 보니 지하철 쥐 밥이 되기 십상이군. 크크."',
    '잭스: "하지만 운이 좋네? 내가 요즘 \'머릿수\'를 좀 모으고 있거든. 본부에 데려가 줄 수도 있는데, 어때?"',
    '(당신은 잭스의 툭 튀어나온 쇄골과 단단해 보이는 골격을 관찰합니다.)',
    "사령술사(독백): '비루한 행색이지만 뼈대는 훌륭하군. 죽여서 일으킨다면 꽤 쓸만한 돌격병이 되겠어...'",
  ]

  // 1. 순차적 대화 노출
  for (const message of dialogues) {
    await enquirer.prompt({
      type: 'input',
      name: 'confirm',
      message,
      format: () => ' (Enter ⏎)',
    })
  }

  // 2. 최종 선택
  const { choice } = await enquirer.prompt<{ choice: 'join' | 'kill' | 'leave' }>({
    type: 'select',
    name: 'choice',
    message: '잭스의 비릿한 제안에 어떻게 답하시겠습니까?',
    choices: [
      { message: '💬 레지스탕스에 협력한다', name: 'join' },
      { message: '💀 뼈를 수거한다 (전투 시작)', name: 'kill' },
      { message: '💬 무시하고 떠난다', name: 'leave' },
    ],
  })

  // 3. 결과 처리
  switch (choice) {
    case 'join':
      Logger.log(`\n잭스: "크크, 역시 살고 싶나 보군? 현명해. 본부 놈들에겐 내가 잘 말해주지. 따라와!"`)
      events.completeEvent('RESISTANCE_BASE')

      // 바로 이동할지 묻는 confirm 분기
      const { goToBase } = await enquirer.prompt<{ goToBase: boolean }>({
        type: 'confirm',
        name: 'goToBase',
        message: '잭스를 따라 지금 즉시 레지스탕스 본부로 이동하시겠습니까?',
        initial: true,
      })

      if (goToBase) {
        handleEnter(player, context)
        return
      } else {
        Logger.log(`\n잭스: "뭐 아직 볼일이 남았어?"`)
        // TODO: 현재 구역에 머무는 로직을 작성하세요.
      }
      break

    case 'kill':
      Logger.log(`\n잭스: "뭐? 그 눈빛은 뭐야? 감히 이 잭스 님을...!"`)
      Logger.log(`사령술사: "걱정 마라. 죽어서는 지금보다 훨씬 쓸모 있는 존재가 될 테니까."`)
      const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], context)

      if (isWin) {
        events.completeEvent('RESISTANCE_BASE')
        npcs.updateFactionHostility('resistance', 40)
      } else {
        npcs.updateFactionHostility('resistance', 10)
      }

      tile.isClear = true
      return true

    case 'leave':
      Logger.log(`\n잭스: "흥, 겁에 질려서 도망가는 꼴이라니! 다신 내 눈앞에 띄지 마라!"`)
      break
  }
}

function handleEnter(player: Player, context: GameContext) {
  const { map } = context

  Logger.log(`\n잭스: "좋아, 딴청 피우지 말고 바짝 붙으라고. 여기 길은 좀 복잡하니까."`)

  map.changeScene(MAP_IDS.B3_5_RESISTANCE_BASE, player)
}

export default JaxHandler
