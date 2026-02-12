import enquirer from 'enquirer'
import _ from 'lodash'
import { GameContext, NPC, Tile } from '../types'
import { NPCHandler } from './NPCHandler'
import BossEvent from '../systems/events/BossEvent'
import { Player } from '../core/Player'
import { speak } from '../utils'

let count = 0
let firstAnswer: boolean | null = null
let secondAnswer: boolean | null = null

const CaronHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'talk', message: '💬 대화' },
      { name: 'battle', message: '💀 청소 (전투)' },
    ]
  },

  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        await handleCaronEvent(player, npc, context)
        break
      case 'battle':
        await handleBattle(player, npc, context, true)
        break
    }
  },
}

function relocateCaron(player: Player, npc: NPC, context: GameContext) {
  const { map } = context
  const tiles: (Tile | null)[][] = map.currentScene.tiles

  // 1. 현재 타일 이벤트 제거
  const currentTile = map.getTile(player.pos.x, player.pos.y)
  if (currentTile) {
    currentTile.event = 'none'
    if (currentTile.npcIds) {
      currentTile.npcIds = _.without(currentTile.npcIds, npc.id)
    }
  }

  // 2. 전체 타일 관찰 메시지 초기화 (Null 체크 추가)
  tiles.forEach(row => {
    row?.forEach(tile => {
      if (tile) {
        tile.observe = '...폐허뿐이 보이지 않습니다.'
      }
    })
  })

  // 3. 새 후보지 추출
  const candidateTiles: { x: number, y: number, tile: Tile }[] = []
  tiles.forEach((row, y) => {
    row?.forEach((tile, x) => {
      if (tile && tile.event === 'event-caron') {
        candidateTiles.push({ x, y, tile })
      }
    })
  })

  // 4. 랜덤 이동 및 힌트 설정
  const target = _.sample(candidateTiles)
  if (target) {
    const { x, y, tile } = target
    if (!tile.npcIds) tile.npcIds = []
    tile.npcIds.push(npc.id)

    const directions = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ]

    directions.forEach(dir => {
      const ny = y + dir.dy
      const nx = x + dir.dx
      const neighbor = tiles[ny]?.[nx] // Optional chaining으로 안전하게 접근
      if (neighbor) {
        neighbor.observe = '아공간의 농도가 급격히 짙어집니다. 아주 가까운 곳에 목표가 숨어 있습니다.'
      }
    })
  }
}

async function handleCaronEvent(player: Player, npc: NPC, context: GameContext) {
  if (count === 0) {
    await firstEncounter()
    relocateCaron(player, npc, context)
    count++
  } else if (count === 1) {
    await secondEncounter()
    relocateCaron(player, npc, context)
    count++
  } else await finalEncounter(player, npc, context)
}

/** 1차 대면: 시스템에 대한 순응도 확인 */
async function firstEncounter() {
  await speak([
    '카론: "(빈 요람을 물끄러미 바라보며) 예의 없는 발걸음이군요."',
    '카론: "알고 있습니다. 제가 먼저 사신의 법도를 어겼고, 그분은 그저 정해진 섭리대로 아이의 영혼을 회수하셨을 뿐이지요."',
    '카론: "관리자이기 전에 부모였던 저로서는, 그 공정함이 무엇보다 시리고 잔혹하게 느껴지더군요."',
  ])

  const { answer } = await enquirer.prompt<{ answer: boolean }>({
    type: 'confirm',
    name: 'answer',
    message: '카론: "당신 또한 사신의 법도 아래서, 기계적인 숙청을 반복하는 노예의 삶에 만족하십니까?"',
    initial: false,
  })

  firstAnswer = answer
  await speak([
    answer
      ? '카론: "충직하시군요. 하지만 그 충성심이 때로는 가장 비정한 칼날이 된다는 것을 곧 알게 되실 겁니다."'
      : '카론: "그 눈빛... 왕관의 무게를 기억하는 자라면 마땅히 느껴야 할 갈증이 보이는군요."',
  ])

  console.log('\n카론이 안개 속으로 모습을 감춥니다.')
}

/** 2차 대면: 시스템에 대한 분노와 복수심 확인 */
async function secondEncounter() {
  await speak([
    '카론: "(이전과 달리 떨리는 목소리로) ...하지만 말입니다. 규칙이 영혼보다 중하단 말입니까?"',
    '카론: "사신은 제 아이를 \'오류 데이터\' 취급하며 지워버렸습니다. 제가 쌓아온 수백 년의 헌신은 안중에도 없었죠."',
    '카론: "저는 증오합니다. 슬픔조차 허용하지 않는 그 차가운 질서를, 그리고 내 아이를 한 줌의 연기로 만든 그 무미건조한 손길을!"',
  ])

  const { answer } = await enquirer.prompt<{ answer: boolean }>({
    type: 'confirm',
    name: 'answer',
    message:
      '카론: "집행관이여, 당신도 만약 사신의 원칙이 당신의 소중한 것을 파괴한다면, 그분에게 칼끝을 겨누겠습니까?"',
    initial: false,
  })

  secondAnswer = answer
  await speak(['카론: "알겠습니다. 당신이라는 존재의 무게를... 이제는 완전히 알 것 같군요."'])

  console.log('\n카론의 기운이 격렬하게 일렁이다 사라집니다.')
}

/** 최종 대면: 답변 판단 및 최종 결판 */
async function finalEncounter(player: Player, npc: NPC, context: GameContext) {
  const { events, map } = context

  // 1. 최악의 조합 판별: 야심도 없고 반역 의사도 없는 경우
  if (firstAnswer && !secondAnswer) {
    await speak([
      '카론: "(차갑게 가라앉은 목소리로) 도망은 여기까지입니다.\n당신은 제 모든 질문에 사신의 충견다운 답만을 내놓으셨죠."',
      '카론: "야심도, 분노도, 슬픔도 없는... 영혼조차 없는 기계적인 집행자."',
      '카론: "당신 같은 자와는 더 이상 나눌 대화도, 건넬 제안도 없습니다.\n그 무미건조한 충성심과 함께 이곳에서 소멸하십시오!"',
    ])
    await handleBattle(player, npc, context)
    return // 이벤트 종료
  }

  // 2. 대화가 통하는 조합 (최종 제안 진행)
  let specificLines: string[] = []
  if (!firstAnswer && secondAnswer) {
    specificLines = [
      '카론: "사신을 찬탈하고 스스로 새로운 법도가 되려는 야심가시여.\n당신의 복수심은 제 갈증을 채워주기에 충분합니다."',
    ]
  } else if (firstAnswer && !secondAnswer) {
    specificLines = ['카론: "야망은 있으나 질서에 묶여있는 군주시여.\n당신은 결국 사신의 가장 위험한 검이 되겠군요."']
  } else if (!firstAnswer && secondAnswer) {
    specificLines = [
      '카론: "겉으로는 순종하나 가슴 속엔 반역의 불꽃을 품은 집행자여.\n그 기만적인 침묵이 사신을 무너뜨릴 독이 되길 바랍니다."',
    ]
  }

  await speak([
    '카론: "(무릎을 꿇은 채 고결하게) 도망은 여기까지입니다.\n저는 제 위반에 대한 마지막 책임을 질 준비가 되었습니다."',
    ...specificLines,
    '카론: "마지막 제안입니다. 사신께는 제 영혼의 껍데기를 바치고,\n제 본질은 당신의 그림자가 되어 그분의 완벽한 시스템에 \'비공식적인 오점\'을 남겨보겠습니다."',
  ])

  const { choice } = await enquirer.prompt<{ choice: boolean }>({
    type: 'confirm',
    name: 'choice',
    message: '카론: "저와 함께 사신을 기만하고, 언젠가 그분의 목을 칠 기회를 엿보겠습니까?"',
    initial: true,
  })

  if (choice) {
    await speak([
      '카론: "현명한 선택입니다. 규율을 어기는 것은 한 번이 어렵지, 두 번은 쉽더군요."',
      '카론: "하지만 사신은 영민한 분입니다. 제 영혼의 흔적을 가져가지 않는다면 당신을 즉시 의심하고 도려내려 하겠지요."',
      '카론: "(자신의 가슴 깊은 곳에서 희미하게 빛나는 조각 하나를 떼어내며) ...윽, 이것을 가져가십시오."',
      '카론: "이 파편만큼은 진실된 것입니다. 사신에게는 이것을 바쳐 제가 완전히 소멸했다 믿게 만드십시오."',
      '카론: "저는 평소 사신의 시선이 닿지 않는 [지하 엘리베이터 앞 안전구역]의 차원 틈새에 몸을 숨기고 있겠습니다."',
      '카론: "군세의 관리가 필요하다면 그곳으로 오십시오. 오늘부터 당신의 그림자이자, 사신을 무너뜨릴 가장 은밀한 균열이 되겠습니다."',
      '[카론의 영혼 파편(기만용)]을 획득했습니다.'
    ])

    events.completeEvent('caron_is_mine')

    npc.dead(0)
    const tile = map.getTile(player.x, player.y)
    
    BossEvent.spawnPortal(tile)
  } else {
    await speak([
      '카론: "(씁쓸하게 미소 지으며) 결국 사냥개의 길을 택하시는군요.\n무결한 집행관이여... 그럼 제 위반의 마지막 책임을 물어주시길."',
    ])
    await handleBattle(player, npc, context)
  }
}

/** 전투 핸들러 */
async function handleBattle(player: Player, npc: NPC, context: GameContext, isManual: boolean = false) {
  const { battle, events,map } = context

  if (isManual) {
    await speak(['카론: "무례하군요. 제 이야기가 끝나기도 전에 칼을 뽑다니... 사신이 보낸 도살자답습니다."'])
  }

  console.log(`\n카론과의 전투를 시작합니다!`)
  const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], context)

  if (isWin) {
    await speak([
      '카론: "(쓰러진 채 당신을 향해 떨리는 손을 뻗지만, 당신은 그 손을 짓밟고 그의 가슴에 손을 얹습니다.)"',
      '카론: "무엇을... 설마 죽어가는 영혼의 정수까지 뜯어내려는 겁니까? 당신은... 사신보다 더한 괴물...!"',
      '당신은 비명을 지르는 카론의 영혼을 붙잡아 강제로 끌어당깁니다.',
      '뿌득거리는 기괴한 소리와 함께 카론의 영혼이 조각나며 당신의 손 안에서 칠흑 같은 구체로 응축됩니다.',
      '추출한 정수는 당신의 명령에 따라 기괴한 형상으로 빚어지며 안개 속으로 사라집니다.',
      '자아를 잃은 카론의 잔재는 이제 엘리베이터 부근의 차원 틈새에 머물며 당신을 기다릴 것입니다.',
      '이제 안전 구역에서 사역마를 통해 소환수들을 아공간에 유폐하거나 해방할 수 있습니다.',
      '주인을 잃고 정화된 [정제된 영혼 조각]이 바닥에 떨어집니다.',
    ])


    events.completeEvent('caron_is_dead')

    const tile = map.getTile(player.x, player.y)

    BossEvent.spawnPortal(tile)
  }
}

export default CaronHandler
