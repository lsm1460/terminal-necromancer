import { Player } from '../core/Player'
import { GameContext } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'
import enquirer from 'enquirer'

const ZedHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isB2Completed = context.events.isCompleted('second_talk_death')
    const isB3Completed = context.events.isCompleted('second_boss')
    const alreadyHeard = context.events.isCompleted('HEARD_RESISTANCE')

    return [
      { name: 'talk', message: '💬 잡담' },
      ...(isB2Completed && !alreadyHeard ? [{ name: 'resistance', message: '💬 대화' }] : []),
      ...(isB3Completed ? [{ name: 'upgrade_golem', message: '🧬 골렘 개조' }] : []),
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
  const upgradeCost = Math.floor(100 * (totalStacks + 1) * penaltyMultiplier)
  const removeCost = 200

  // 2. 입장 시 기계 혐오 대사
  if (machineStacks > 0) {
    console.log(`\n닥터 제드: "우아악! 이 비린내 나는 쇳덩어리들은 뭐야?! 당장 내 눈앞에서 치우지 못해?!"`)
    console.log(
      `닥터 제드: "이런 고철 쓰레기들 때문에 내 정수가 들어갈 자리가 없다고요! 억지로 밀어 넣으려면 EXP나 더 내놓으시지!"`
    )
  }

  // 3. 메뉴 구성
  const choices = [
    {
      name: 'soul_upgrade',
      message: `🧬 [생체 변이] Soul 슬롯 주입 (비용: ${upgradeCost} EXP)`,
    },
    {
      name: 'remove_soul',
      message: `🔪 [생체 적출] Soul 스택 하나 제거 (비용: ${removeCost} EXP)`,
    },
    {
      name: 'exit',
      message: '🔙 뒤로가기',
    },
  ]

  const { action } = await enquirer.prompt<{ action: string }>({
    type: 'select',
    name: 'action',
    message: `[ 현재 슬롯: ${player.golemUpgrade.join(' | ') || 'EMPTY'} ]`,
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
      console.log(`\n💉 [집도 완료] 'Soul' 정수를 주입했습니다.`)
    }
  } else if (action === 'remove_soul') {
    if (soulStacks === 0) {
      console.log(`\n닥터 제드: "내 정수가 하나도 없는데 뭘 도려내라는 거야?"`)
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

export default ZedHandler
