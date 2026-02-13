import enquirer from 'enquirer'
import { Player } from '../core/Player'
import { GameContext, NPC } from '../types'
import { handleBuy, handleSell, handleTalk, NPCHandler } from './NPCHandler'

const MayaHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isJoined = context.events.isCompleted('RESISTANCE_BASE')
    const isAlreadyMet = context.events.isCompleted('maya_1')
    const isB3Completed = context.events.isCompleted('second_boss')
    const hasGolem = !!player._golem

    if (isJoined && !isAlreadyMet) {
      return [{ name: 'join', message: '💬 대화' }]
    }

    const canMakeGolem = isB3Completed && !hasGolem
    const canUpgrade = npc.factionContribution > 40 && context.events.isCompleted('second_boss') && !!player._golem
    const canModify = npc.factionContribution > 80 && context.events.isCompleted('third_boss')

    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'buy', message: '💰 아이템 구매' },
      { name: 'sell', message: '📦 아이템 판매' },
      ...(canMakeGolem ? [{ name: 'golem', message: '🤖 골렘 생성' }] : []),
      ...(canUpgrade ? [{ name: 'upgrade_golem', message: '🤖 골렘 강화' }] : []),
      ...(canModify ? [{ name: 'modify_darknight', message: '⚔️ 다크나이트 장비 변경' }] : []),
    ]
  },
  async handle(action, player, npc, context) {
    // TODO: npc.factionContribution 기여도와 진행도에 따라 상품 목록 변경 가능

    const mayaScripts = {
      buy: {
        greeting: '필요한 게 있다면 골라봐. 공짜는 없는 거 알지?',
        noStock: '재고가 다 떨어졌어. 나중에 다시 오라고.',
        noGold: '잔액이 모자라는데. 하역장에서 고철이라도 더 주워와.',
        success: '물건 확인해 봐. 쓸만할 거야.',
      },
      sell: {
        greeting: '주워온 것 좀 볼까? 쓸모없는 건 안 받아.',
        noItems: '주머니가 비었네. 더 팔 건 없는 거지?',
        success: '상태가 나쁘지 않군. 여기, 약속한 대가야.',
        exit: '살아남으라고. 죽으면 거래도 끝이니까.',
      },
    }

    switch (action) {
      case 'join':
        await handleJoin(player, context)
        break
      case 'talk':
        handleTalk(npc)
        break
      case 'buy':
        await handleBuy(player, npc, context, 'resistance_shop', mayaScripts.buy)
        break
      case 'sell':
        await handleSell(player, npc, context, mayaScripts.sell)
        // TODO: 판매 창 로직 호출
        break
      case 'golem':
        await handleAwakeGolem(player, npc, context)
        break
      case 'upgrade_golem':
        await handleUpgradeGolem(player)
        break
      case 'modify_darknight':
        console.log('\n[마야]: "다크나이트의 무장 상태를 변경할게."')
        // TODO: 다크나이트 장비 관리 호출
        break
      default:
        break
    }
  },
}

async function handleJoin(player: Player, context: GameContext) {
  const { events, npcs } = context

  const isB3Completed = context.events.isCompleted('second_boss')
  const hasGolem = !!player._golem
  const canMakeGolem = isB3Completed && !hasGolem
  const { isAlive: jaxIsAlive } = npcs.getNPC('jax_seeker') || {}

  const dialogues = [
    '???: "앗! 거기 조심해! 방금 나사가 하나 굴러갔단 말이야! 밟으면 큰일 난다고!"',
    '마야: "헤헤, 안녕? 난 마야야. 이 칙칙한 터미널에서 유일하게 기계와 대화할 줄 아는 천재 기술자지!"',
  ]

  // 1. 잭스 안부
  if (jaxIsAlive) {
    dialogues.push(
      '마야: "오, 잭스 아저씨랑 아는 사이야? 아저씨 신발 부스터는 내가 늘 최고 상태로 유지해두니까 걱정 마!"'
    )
  } else {
    dialogues.push(
      '마야: "...응? 잭스 아저씨 소식을 몰라? 하역장 쪽으로 정찰 나간 지 꽤 됐는데... 아저씨가 없으면 내 정밀 부품은 누가 구해주지? 걱정되네 정말."'
    )
  }

  // 2. 골렘 및 제드 관련 분기
  if (hasGolem) {
    // 플레이어가 이미 제드를 통해 골렘을 기동시킨 경우
    dialogues.push(
      '마야: "와! 그 골렘... 잠깐, 이 불쾌한 마력 흐름은 뭐야? 설마... 제드 그 아저씨가 만진 거야?"',
      '마야: "(입술을 삐죽이며) 흥, 여전하네. 영혼 조각을 억지로 쑤셔 넣어서 기계 비명을 지르게 만들다니... 사신의 개 노릇을 하더니 기술자로서의 자존심도 버렸나 봐."',
      '마야: "이봐, 나중에 그 골렘이 이상하게 작동하면 당장 나한테 가져와! 내가 그 기분 나쁜 마력들 싹 걷어내고, 진짜 \'기계다운\' 힘을 보여줄 테니까!"'
    )
  } else if (canMakeGolem) {
    // 골렘을 만들 수 있는 상황
    dialogues.push(
      '마야: "있잖아, 지금 하역장에 버려진 부품들이 꽤 쓸만해 보이던데! 내가 도와줄 테니까 골렘 한 대 제대로 뽑아보는 게 어때?"',
      '마야: "제드 같은 녀석이 영혼을 갈아 넣어 만든 괴물 말고, 우리가 힘을 합쳐 만든 진짜 레지스탕스의 병기 말이야! 어때, 짜릿하지?"'
    )
  } else {
    // 아직 골렘을 만들 수 없는 상황 (제안)
    dialogues.push(
      '마야: "사신 놈들이 하역장 골렘들을 영혼 감시용으로 쓰는 건 다 제드 그 인간 작품일 거야.\n옛날엔 케인 대장이랑 같이 저항하더니, 이젠 영혼 조각 연구에 미쳐서 저쪽으로 붙어버렸지."',
      '마야: "그러니까 나중에 그 녀석들을 마주치면 가차 없이 박살 내버려!\n그게 터미널에 저항하는 가장 멋진 방법이니까."',
      '마야: "그다음 부서진 핵을 가져오면, 제드 방식이랑은 차원이 다른 \'진짜 골렘\'으로 다시 태어나게 해줄게. 약속이야!"'
    )
  }

  dialogues.push('마야: "헤헤, 그럼 난 마저 기름 좀 칠하고 있을게. 필요한 거 있으면 언제든 말해!"')

  for (const message of dialogues) {
    await enquirer.prompt({
      type: 'input',
      name: 'confirm',
      message,
      format: () => ' (Enter ⏎)',
    })
  }

  events.completeEvent('maya_1')
}

async function handleAwakeGolem(player: Player, npc: NPC, context: GameContext) {
  if (player._golem) {
    // 이미 골렘을 가지고 있는 경우
    console.log(`\n마야: "뭐야, 이미 골렘 한 마리 데리고 있잖아? 욕심도 많네. 걔나 잘 관리해."`)
    return
  }

  const dialogues = [
    '마야: 뭐야, 그 넝마가 된 덩어리는? ...설마 지하 3층 골렘의 핵이야?',
    '마야: 하, 아주 박살을 내놨네. 남들은 고물상에나 팔겠지만, 운 좋은 줄 알아.',
    '마야: 나니까 이 정도 파편이라도 다시 이어붙여 볼 수 있는 거야.',
    '마야: 자, 그거 이쪽으로 넘겨. 원래보다 훨씬 쓸만하게 만들어줄 테니까.',
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
    // 강행하지 않기로 했을 때
    console.log('\n마야: "쫄긴. 뭐, 죽기 싫으면 관두는 게 현명하긴 하지. 다시 생각나면 가져오든가."')
    return
  }

  player._golem = {
    id: 'golem',
    name: '하역장의 기계 골렘',
    attackType: 'melee',
    baseMaxHp: 90,
    maxHp: 90,
    hp: 90,
    baseAtk: 40,
    atk: 40,
    baseDef: 50,
    def: 50,
    agi: 3,
    exp: 0,
    description: '하역장에서 수거한 핵으로 마야가 부활시킨 거대 병기입니다.',
    dropTableId: '',
    encounterRate: 0,
    isAlive: true,
    skills: ['power_smash'],
    isMinion: true,
    isGolem: true,
    deathLine: '(알 수 없는 기계음)',
    orderWeight: -15,
  }

  context.npcs.updateFactionContribution(npc.faction, 40)

  // 성공 시 대사
  console.log(`\n[⚙️ 골렘 기동 성공]`)
  console.log(`마야: "좋아, 사신의 마력이 제대로 스며들었어. 눈 떠, 이 고물덩어리야!"`)
  console.log(`마야: "(끼릭거리는 기계음과 함께) 봐, 완벽하지? 이제 이 녀석은 네 명령만 들을 거야."`)
  console.log(`마야: "폭주해서 너까지 밟아버리지 않게 조심하라고. 난 책임 안 진다?"`)
}

async function handleUpgradeGolem(player: Player) {
  const machineStacks = player.golemUpgrade.filter((s) => s === 'machine').length
  const soulStacks = player.golemUpgrade.filter((s) => s === 'soul').length
  const totalStacks = player.golemUpgrade.length

  // 1. 비용 계산 로직 (골드로 변경)
  const penaltyMultiplier = 1 + soulStacks * 0.5
  const upgradeCost = Math.floor(1000 * (totalStacks + 1) * penaltyMultiplier) // 골드 기준 밸런싱
  const removeCost = 3000

  // 2. 입장 시 생체(Soul) 혐오 대사
  if (soulStacks > 0) {
    console.log(`\n마야: "우으으... 이 끈적거리고 기분 나쁜 검은 안개는 뭐야? 그 안경잡이 아저씨 짓이지?!"`)
    console.log(
      `마야: "기계 속에 이런 오물을 집어넣다니... 으, 닦아내는 데 세척비랑 공임비 더 받을 거야! 금화 넉넉히 챙겨왔지?"`
    )
  }

  // 3. 메뉴 구성
  const choices = [
    {
      name: 'machine_upgrade',
      message: `⚙️ [기계 강화] 고성능 파츠 증설 (비용: ${upgradeCost} GOLD)`,
    },
    {
      name: 'remove_machine',
      message: `🔧 [파츠 해체] Machine 스택 하나 제거 (비용: ${removeCost} GOLD)`,
    },
    {
      name: 'exit',
      message: '🔙 뒤로가기',
    },
  ]

  const { action } = await enquirer.prompt<{ action: string }>({
    type: 'select',
    name: 'action',
    message: `[ 현재 슬롯: ${player.golemUpgrade.join(' | ') || 'EMPTY'} ] / 내 골드: ${player.gold}G`,
    choices,
  })

  // 4. 실행 로직
  if (action === 'machine_upgrade') {
    if (totalStacks >= player.upgradeLimit) {
      console.log(`\n마야: "미안하지만 공간이 꽉 찼어! 억지로 끼워 넣으면 프레임이 휘어버릴걸? 그건 기술자의 수치야!"`)
      return
    }

    if (player.gold < upgradeCost) {
      console.log(`\n마야: "에이, 돈이 모자라잖아! 레지스탕스도 공짜로는 부품 못 구해온다구. 얼른 벌어와!"`)
      return
    }

    player.gold -= upgradeCost
    player.golemUpgrade.push('machine')

    console.log(`\n🛠️ [공정 완료] 마야가 렌치로 마지막 볼트를 조였습니다!`)
    console.log(`마야: "보라고! 이 매끈하고 단단한 강철의 광택! 영혼 따위 안 섞여도 이게 바로 진짜 기술의 힘이지!"`)
  } else if (action === 'remove_machine') {
    if (machineStacks === 0) {
      console.log(`\n마야: "내가 달아준 파츠가 하나도 없는데 뭘 떼라는 거야? 이상한 사람이라니까!"`)
      return
    }

    if (player.gold < removeCost) {
      console.log(`\n마야: "해체하는 것도 다 인건비라고! 정당한 골드를 주지 않으면 드라이버 한 번 안 움직일 거야!"`)
      return
    }

    player.gold -= removeCost
    const lastMachineIndex = player.golemUpgrade.lastIndexOf('machine')
    player.golemUpgrade.splice(lastMachineIndex, 1)

    console.log(`\n🔧 [파츠 해체 완료] 마야가 아쉬운 표정으로 깔끔하게 떼어낸 부품을 챙깁니다.`)
    console.log(`마야: "치, 이렇게 좋은 파츠를 왜 버리는 건지 모르겠네... 중고로 팔아버릴 거야!"`)
  } else if (action === 'exit') {
    console.log(`\n마야: "다음에 또 봐! 기름칠하는 거 잊지 말고!"`)
  }
}

export default MayaHandler
