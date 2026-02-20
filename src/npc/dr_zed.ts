import { Player } from '../core/Player'
import { GameContext } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'
import enquirer from 'enquirer'

const ZedHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isB2Completed = context.events.isCompleted('talk_death_2')
    const isB3Completed = context.events.isCompleted('second_boss')
    const alreadyHeard = context.events.isCompleted('HEARD_RESISTANCE')
    const alreadyDenied = context.events.isCompleted('golem_generation_denied_zed')

    if (isB3Completed && !player._golem && !alreadyDenied) {
      return [{ name: 'golem', message: '💬 [!] 대화' }]
    }

    return [
      { name: 'talk', message: '💬 잡담' },
      ...(isB2Completed && !alreadyHeard ? [{ name: 'resistance', message: '💬 대화' }] : []),
      ...(isB3Completed
        ? player._golem
          ? [{ name: 'upgrade_golem', message: '🧬 골렘 개조' }]
          : [{ name: 'golem', message: '🧬 골렘 부활' }]
        : []), // false라면 빈 배열을 반환하여 아무것도 추가되지 않음
      { name: 'heal', message: '💊 치료' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'resistance':
        await handleGossip(context)
        break
      case 'heal':
        handleHeal(player)
        break
      case 'golem':
        await handleAwakeGolem(player, context)
        break
      case 'upgrade_golem':
        await handleUpgradeGolem(player)
        break
      default:
        break
    }
  },
}

function handleHeal(player: Player) {
  player.hp = player.maxHp
  player.mp = player.maxMp

  player.minions.forEach((minion) => {
    minion.isAlive = true
    minion.hp = minion.maxHp
  })

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`💉 [의무실 기록: 닥터 제드]`)

  // 상황에 따른 제드의 대사 (랜덤 혹은 고정)
  const medicalLogs = [
    `"재료가 상하면 곤란하니까요. 일단은 전부 기워 붙여놨습니다."`,
    `"무료라고 너무 좋아하지 마세요. 당신 몸에 뭘 심어놨는지는 나중에 알게 될 테니까."`,
    `"시체 냄새가 진동하는군요. 소독약을 들이부었으니 당분간은 안 썩을 겁니다."`,
    `"다음엔 팔다리 하나쯤은 떼어놓고 와도 되는데. 운이 좋았군요."`,
  ]
  const randomLog = medicalLogs[Math.floor(Math.random() * medicalLogs.length)]

  console.log(randomLog)
  console.log(`✨ HP/MP와 모든 소환수의 상태가 완벽하게 복구되었습니다.`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

async function handleGossip(context: GameContext) {
  const { events } = context

  const alreadyKnowResistance = events.isCompleted('RESISTANCE_BASE')

  let dialogues: string[] = [
    '닥터 제드: "터미널 구석구석을 돌아다니다 보면... 가끔 쥐새끼 같은 무리들을 마주치게 될 겁니다."',
    '닥터 제드: "스스로를 \'레지스탕스\'라고 부르는 자들이죠. 한때는 나도 그들과 같은 배를 탔던 적이 있습니다만..."',
  ]

  if (alreadyKnowResistance) {
    // 1. 이미 그들을 알고 있을 때 (비꼬는 태도)
    dialogues = [
      ...dialogues,
      '닥터 제드: "오, 벌써 그 고리타분한 친구들을 만나고 오셨나 보군요."',
      '닥터 제드: "신념이니 인권이니 하며 몸에 칼 대는 걸 신성모독이라 부르는 겁쟁이들 말입니다."',
      '닥터 제드: "그들은 진화의 가능성을 두려워하죠. 나처럼... \'실용적인\' 의사를 이해하지 못하거든요."',
      '닥터 제드: "그곳에 너무 깊게 발 담그진 마세요. 죽지도 살지도 못하는 당신 몸을 보면, 그들은 당신을 구원하려 들 테니까. 그게 당신에겐 가장 끔찍한 결말일걸요?"',
    ]
  } else {
    // 2. 처음 정보를 줄 때 (넌지시 경고)
    dialogues = [
      ...dialogues,
      '닥터 제드: "그들은 너무 멍청해요. 사람을 살리는 기술이 있는데도, \'윤리\'라는 족쇄에 묶여 도구조차 제대로 쓰지 못하죠."',
      '닥터 제드: "결국 난 내 메스를 들고 여기 터미널로 들어왔습니다. 적어도 여긴 재료가 부족할 일은 없으니까."',
      '닥터 제드: "조심하는 게 좋을 겁니다. 그들은 당신 같은 네크로맨서를 \'부자연스러운 괴물\'로 보니까요."',
    ]
  }

  // 1. 순차적 대화 노출
  for (const message of dialogues) {
    await enquirer.prompt({
      type: 'input',
      name: 'confirm',
      message,
      format: () => ' (Enter ⏎)',
    })
  }

  events.completeEvent('HEARD_RESISTANCE')
}

async function handleUpgradeGolem(player: Player) {
  const ZED_LIMIT = player.upgradeLimit + 1 // 6

  const machineStacks = player.golemUpgrade.filter((s) => s === 'machine').length
  const soulStacks = player.golemUpgrade.filter((s) => s === 'soul').length
  const totalStacks = player.golemUpgrade.length

  // 1. 비용 계산 로직 단일화
  const penaltyMultiplier = 1 + machineStacks * 0.5
  const upgradeCost = Math.floor(500 * (totalStacks + 1) * penaltyMultiplier)
  const removeCost = 1500

  // 2. 입장 시 기계 혐오 대사
  if (machineStacks > 0) {
    console.log(`\n닥터 제드: "우아악! 이 비린내 나는 쇳덩어리들은 뭐죠?! 당장 내 눈앞에서 치워주시겠어요?!"`)
    console.log(`닥터 제드: "이런 고철 쓰레기들 때문에 내 정수가 들어갈 자리가 없다고요!"`)
  }

  // 3. 메뉴 구성
  const choices = [
    {
      name: 'soul_upgrade',
      message: `🧬 [생체 변이] Soul 슬롯 주입 (비용: 영혼 조각 ${upgradeCost}개)`,
    },
    {
      name: 'remove_soul',
      message: `🔪 [생체 적출] Soul 스택 하나 제거 (비용: 영혼 조각 ${removeCost}개)`,
    },
    {
      name: 'exit',
      message: '🔙 뒤로가기',
    },
  ]

  const { action } = await enquirer.prompt<{ action: string }>({
    type: 'select',
    name: 'action',
    message: `[ 현재 슬롯: ${player.golemUpgrade.join(' | ') || 'EMPTY'} ] / 보유 영혼 조각: ${player.exp}`,
    choices,
  })

  // 4. 실행 로직
  if (action === 'soul_upgrade') {
    if (totalStacks === player.upgradeLimit) {
      console.log(`\n닥터 제드: (메스를 부들부들 떨며) "슬롯이 없다고? 아니, 내가 '만들면' 있는 겁니다!"`)
    } else if (totalStacks >= ZED_LIMIT) {
      console.log(`\n닥터 제드: "더 이상은 안 됩니다. 이 이상 넣으면 골렘이 아니라 폭발하는 고기 풍선이 될 뿐이에요."`)
      return
    }

    if (player.exp < upgradeCost) {
      console.log(`\n닥터 제드: "영혼 조각이 부족하잖아!"`)
      return
    }

    player.exp -= upgradeCost
    player.golemUpgrade.push('soul')

    if (totalStacks === player.upgradeLimit) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`💉 [광기의 한계 돌파 집도 완료]`)
      console.log(`닥터 제드: "하하하! 억지로 쑤셔 넣으니 결국 들어가잖아! 이제야 좀 '살아있는' 것 같군!"`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    } else {
      console.log('\n💉 [집도 완료] 닥터 제드: "히히히! 보라고, 이 영혼이 강철 속에서 비명을 지르며 요동치고 있어!"')
    }
  } else if (action === 'remove_soul') {
    if (soulStacks === 0) {
      console.log(`\n닥터 제드: "내 정수가 하나도 없는데요?"`)
      return
    }

    if (player.exp < removeCost) {
      console.log(`\n닥터 제드: "적출 수술비도 없으면서 날 부려먹으려고? 영혼 조각이나 더 모아오세요."`)
      return
    }

    player.exp -= removeCost
    const lastSoulIndex = player.golemUpgrade.lastIndexOf('soul')
    player.golemUpgrade.splice(lastSoulIndex, 1)

    console.log(`\n🧪 [생체 적출 완료] 닥터 제드가 만족스러운 미소로 도려낸 조직을 챙깁니다.`)
  } else if (action === 'exit') {
    console.log(`\n닥터 제드: "나갈 때 문 닫으세요. 먼지 들어와"`)
  }
}

async function handleAwakeGolem(player: Player, context: GameContext) {
  const { events } = context
  if (player._golem) {
    console.log(`\n제드: "이미 기동 중인 개체입니다. 중복 출력은 자원 낭비일 뿐이죠."`)
    return
  }

  const dialogues = [
    '제드: ...이건 지하 3층을 지키던 골렘의 핵이군요.',
    '제드: 코어가 완전히 박살 났어. 보통 사람이라면 쓰레기통에나 던졌겠지만...',
    '제드: 운이 좋군. 나 정도의 실력자라면 다시 맥동하게 만들 수 있습니다.',
    '제드: 자, 그 핵을 이쪽으로 넘겨주세요. 원래보다 더 강력하게 고쳐주도록 하지요.',
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

  // 3. 최종 확인
  const warningMsg = `핵에 사신의 마력을 주입합니다. 골렘이 불완전하게 깨어나며 폭주할 위험이 있습니다. 강행하시겠습니까?`
  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: warningMsg,
    initial: false,
  })

  if (!proceed) {
    events.completeEvent('golem_generation_denied_zed')

    console.log('\n제드: "현명한 선택입니다. 아직 금속의 비명이 멈추지 않았으니까요."')
    return
  }

  player._golem = {
    id: 'golem',
    name: '하역장의 기계 골렘',
    attackType: 'melee',
    baseMaxHp: 80,
    maxHp: 80,
    hp: 80,
    baseAtk: 30,
    atk: 30,
    baseDef: 20,
    def: 20,
    agi: 3,
    exp: 0,
    description:
      '하역장에서 수거한 핵으로 제드가 부활시킨 거대 병기입니다.\n사신의 마력이 깃들어 금속 틈새로 검은 안개가 뿜어져 나옵니다.',
    dropTableId: '',
    encounterRate: 0,
    isAlive: true,
    skills: ['power_smash'],
    isMinion: true,
    isGolem: true,
    deathLine: '(알 수 없는 기계음)',
    orderWeight: -15,
  }

  console.log(`\n[⚙️ 골렘 기동 성공]`)
  console.log(`제드: "시스템 로드 완료. 보시다시피... 꽤 훌륭한 살육 병기가 되었군요."`)
  console.log(`제드: "이제 이 고철 덩어리는 당신의 그림자를 따라다니며 앞길을 가로막는 것들을 짓이겨 놓을 겁니다."`)
  console.log(`제드: "원한다면 골렘을 강화시킬 방법이 있을지도 모릅니다.."`)
}

export default ZedHandler
