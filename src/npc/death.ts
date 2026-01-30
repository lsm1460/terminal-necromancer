import enquirer from 'enquirer'
import { INIT_MAX_MEMORIZE_COUNT, SKELETON_UPGRADE } from '../consts'
import { Player } from '../core/Player'
import { SKILL_LIST, SkillUtils } from '../core/skill'
import { GameContext, Skill, SkillId } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'

const DeathHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const isFirst = context.events.isCompleted('first_talk_death')
    const isSecond = context.events.isCompleted('second_talk_death')
    const isB2Completed = context.events.isCompleted('first_boss')
    const isB3Completed = context.events.isCompleted('second_boss')
    const hasSubSpace = player.hasSkill('SPACE')

    if (!isFirst || !isB2Completed) {
      return [{ name: 'intro', message: '💬 대화' }]
    }

    if (isB2Completed && !isSecond) {
      return [{ name: 'tutorialOver', message: '💬 대화' }]
    }

    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'levelUp', message: '✨ 레벨업' },
      ...(isB3Completed ? [{ name: 'increaseLimit', message: '🦴 해골 군단 확장' }] : []),
      ...(isB3Completed && !hasSubSpace ? [{ name: 'getSubSpace', message: '🦴 아공간 획득' }] : []),
      ...(isB3Completed && !player.golem ? [{ name: 'golem', message: '🪨  골렘 정수 부활' }] : []),
      { name: 'unlock', message: '🔮 기술 전수' },
      { name: 'memorize', message: '📜 기술 각인' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'intro':
        await handleIntro(context)
        break
      case 'talk':
        await handleTalk(npc)
        break
      case 'tutorialOver':
        await handleTutorialOver(context)
        break
      case 'levelUp':
        await handleLevelUp(player)
        break
      case 'unlock':
        await handleSkillMenu(player, context)
        break
      case 'memorize':
        await handleMemorize(player)
        break
      case 'increaseLimit':
        await handleIncreaseLimit(player)
      case 'golem':
        await handleAwakeGolem(player)
        break
      case 'getSubSpace':
        await handleGetSubSpace(player)
        break
      default:
        break
    }
  },
}

async function handleIntro(context: GameContext) {
  const { events } = context

  const isFirst = context.events.isCompleted('first_talk_death')
  const isB2Completed = context.events.isCompleted('first_boss')

  if (isFirst && !isB2Completed) {
    console.log(`\n사신: "아직도 청소를 끝내지 못했나? 끝내고 나면 내게 돌아오도록.."`)
    return
  }

  const dialogues = [
    '사신: "아직도 그 오만한 눈빛이라니. 네놈이 다스리던 제국의 흙먼지라도 묻어있는 줄 아는 모양이군."',
    '사신: "착각하지 마라. 이곳 터미널에선 너 또한 심판을 기다리며 줄을 서야 하는 흔해 빠진 망자 중 하나일 뿐이다."',
    '사신: "살아남고 싶다면 네놈이 그토록 경멸하던 노역부터 시작해라. 마침 지하 2층 환승로에 아주 역겨운 게 자라나서 말이지."',
    '사신: "[기어다니는 죄악, 벨페고르]. 제 분수를 모르고 심판을 피해 도망친 영혼들이 서로 엉겨 붙어 탄생한 기괴한 고기 덩어리다."',
    '사신: "그 비천한 것들이 환승로 선로를 점거하고 비명을 지르는 통에 영혼들의 운송이 지체되고 있어."',
    '사신: "가서 그 오물들을 도려내라. 네놈의 그 녹슨 낫이 아직 영혼의 껍질이라도 썰 수 있다면 말이야."',
    '사신: "[아래]로 내려가면 지하로 내려갈 수 있는 엘리베이터가 있다. 청소를 끝내면 나에게 와서 보고하도록.."',
  ]

  for (const message of dialogues) {
    await enquirer.prompt({
      type: 'input',
      name: 'confirm',
      message,
      format: () => ' (Enter ⏎)',
    })
  }

  console.log(
    `\n사신: \"실패하면? 걱정 마라. 네놈의 혼령 또한 저 고기 덩어리의 일부가 되어 영원히 선로나 닦게 될 테니까. 하하하!\"`
  )

  events.completeEvent('first_talk_death')
}

// --- 서브 메뉴: 스킬 전수 ---
async function handleSkillMenu(player: Player, context: GameContext) {
  const { events } = context
  const completed = events.getCompleted()

  const lockableSkills = Object.values(SKILL_LIST).filter((s) => !player.hasSkill(s.id))
  if (lockableSkills.length === 0) {
    console.log('\n[알림] 이미 모든 기술을 터득하셨습니다.')
    return
  }

  const choices = lockableSkills.map((s) => {
    const skillData = SKILL_LIST[s.id]
    // 해금 조건(unlocks)이 completed 배열에 있는지 확인
    const isUnlocked = !skillData.unlocks || skillData.unlocks.every((req) => completed.includes(req))

    return {
      name: s.id,
      message: isUnlocked
        ? `${s.name} (LV: ${skillData.requiredLevel}, SOUL: ${skillData.requiredExp})`
        : `??? (해금 조건: ${skillData.unlockHint || '특정 조건 달성'}) 🔒`,
      disabled: !isUnlocked || player.level < skillData.requiredLevel || player.exp < skillData.requiredExp,
    }
  })

  // 1. Enquirer Select 메뉴 생성
  const { skillId } = await enquirer.prompt<{ skillId: SkillId | 'back' }>({
    type: 'select',
    name: 'skillId',
    message: '전수받을 기술을 선택하세요: 현재 사용 가능한 영혼 조각: ' + player.exp,
    choices: [...choices, { name: 'back', message: '🔙 뒤로 가기' }],
    format: (value) => {
      const selected = choices.find((c) => c.name === value)

      return selected ? selected.message : value
    },
  })

  if (skillId === 'back') {
    return
  }

  const skill = SKILL_LIST[skillId]
  if (SkillUtils.canLearn(player, skill)) {
    player.unlockSkill(skill)
    console.log(`\n💀 [습득] '${skill.name}' 각인을 잊지말라구 끌끌..`)
  } else {
    console.log(`\n[실패] 요구 조건을 충족하지 못했습니다.`)
  }
}

async function handleLevelUp(player: Player) {
  const { required: nextExp, toNext: cost } = player.expToNextLevel()

  const warningMsg = `${cost}개의 영혼 조각을 바친다면, 네 전성기의 힘을 조금이나마 되돌아올지도 모르지..`
  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: warningMsg,
    initial: false,
  })

  if (!proceed) {
    console.log(`사신: "겁쟁이 녀석. 네놈의 그 나약함이 언제까지 네 목숨을 붙여줄지 지켜보마."`)
    return
  }

  if (player.levelUp()) {
    console.log(`\n✨ 축하합니다! 레벨이 올랐습니다. (현재 LV.${player.level})`)
  } else {
    console.log(`\n[실패] 가볍구나. 겨우 이 정도인가? (${player.exp}/${nextExp})`)
  }
}

async function handleMemorize(player: Player) {
  const isSoulGrown = player.maxMemorize > INIT_MAX_MEMORIZE_COUNT

  const welcomeMessage = isSoulGrown
    ? `💀 사신: "오호... 네 영혼의 그릇이 제법 커졌구나. 더 많은 기술을 감당할 수 있겠어."`
    : `💀 사신: "네 영혼에 새길 기술들을 선택하라..."`

  console.log('\n──────────────────────────────────────────────────')
  console.log(welcomeMessage)
  console.log(`(현재 메모라이즈 제한: ${player.maxMemorize}개)`)
  console.log('──────────────────────────────────────────────────\n')

  // 1. 선택지 구성 (ID를 명확히 찾기 위해 choices 변수 유지)
  const skillChoices = player.unlockedSkills
    .map((skillId) => (SKILL_LIST as Partial<Record<SkillId | 'SPACE', Skill>>)[skillId])
    .filter((skill) => !!skill)
    .map((skill) => {
      return {
        name: skill.name, // multiselect의 기준 키
        message: `${skill.name.padEnd(12)} | 코스트: ${String(skill.cost).padStart(2)} | ${skill.description}`,
      }
    })

  try {
    // 2. prompt 설정 (hint 제거 및 result 로직 수정)
    const { selectedSkills } = await enquirer.prompt<{ selectedSkills: string[] }>({
      type: 'multiselect',
      name: 'selectedSkills',
      message: `메모라이즈할 스킬을 선택하세요 (최대 ${player.maxMemorize}개)`,
      choices: skillChoices,

      // ✅ 초기 체크는 "name 배열"
      initial: player.memorize.map((skillId) => SKILL_LIST[skillId].name),

      maxChoices: player.maxMemorize,

      validate(value: string[]) {
        if (value.length === 0) return '최소 한 개의 스킬은 선택해야 합니다.'
        if (value.length > player.maxMemorize) return `최대 ${player.maxMemorize}개까지만 가능합니다.`
        return true
      },
    } as any)

    // 3. 플레이어 상태 업데이트
    player.memorize = selectedSkills.map(
      (skillName) => Object.entries(SKILL_LIST).find(([, skill]) => skill.name === skillName)![0] as SkillId
    )

    const exitMessage = isSoulGrown
      ? `💀 사신: "그 비대해진 지식이 너를 파멸로 이끌지 않기를..."`
      : `💀 사신: "현명한 선택이기를 바란다..."`

    console.log('\n──────────────────────────────────────────────────')
    console.log(exitMessage)
    console.log(`[ 시스템: ${player.memorize.length}개의 기술이 메모라이즈 되었습니다. ]`)
    console.log('──────────────────────────────────────────────────\n')
  } catch (error) {
    console.log('\n💀 사신: "망설임은 죽음뿐이다..." (선택이 취소되었습니다.)')
  }
}

async function handleIncreaseLimit(player: Player) {
  const currentLimit = player._maxSkeleton || SKELETON_UPGRADE.MIN_LIMIT

  // 1. 최대치 도달 체크 (5구 제한)
  if (currentLimit >= SKELETON_UPGRADE.MAX_LIMIT) {
    console.log(
      `\n사신: "분수를 모르는군. 네놈 같은 필멸자가 다룰 수 있는 망자의 수는 여기까지다. 더 탐했다간 네놈의 영혼부터 먹히게 될 게야."`
    )
    return
  }

  // 2. 필요 경험치 계산
  const cost = SKELETON_UPGRADE.COSTS[currentLimit]

  console.log(
    `\n사신: "그 정도로는 역시 만족하지 못하는 건가? 좋다. 망자의 자리를 더 내어주지. 다만, 그에 걸맞은 영혼의 정수(${cost} EXP)는 준비했겠지?"`
  )
  console.log(`현재 보유 영혼 조각: ${player.exp} / 필요 영혼 조각: ${cost}`)

  // 3. 경험치 부족 체크
  if (player.exp < cost) {
    console.log(
      `사신: "흥, 빈손으로 내 권능을 빌리려 하다니. 가서 그 보잘것없는 목숨이라도 걸고 경험이나 더 쌓고 오거라."`
    )
    return
  }

  // 4. 확인 절차 (Enquirer)
  const warningMsg = `정말로 ${cost}개의 영혼 조각을 바쳐 군단을 확장하겠느냐? 되돌릴 수 없는 계약이다.`
  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: warningMsg,
    initial: false,
  })

  if (!proceed) {
    console.log(`사신: "겁쟁이 녀석. 네놈의 그 나약함이 언제까지 네 목숨을 붙여줄지 지켜보마."`)
    return
  }

  // 5. 실제 업데이트 로직
  player.exp -= cost
  player._maxSkeleton = currentLimit + 1

  console.log(`\n[💀 군단 규모 확장 완료]`)
  console.log(
    `사신: "계약은 성립되었다. 네놈 뒤를 따르는 시체 인형이 하나 더 늘었군. 부디 그놈들에게 잡아먹히지나 말라고, 크크크..."`
  )
  console.log(`스켈레톤 최대 보유 수: ${currentLimit} ➔ ${player._maxSkeleton}`)
}

async function handleAwakeGolem(player: Player) {
  if (player._golem) {
    console.log(`\n사신: "이미 네 곁에 그 흉물스러운 철덩이가 있지 않나. 탐욕도 병이군."`)
    return
  }

  // 1. 사신의 조소
  console.log(`\n사신: "오호... 그 고철더미 속에서 기어코 그 '핵'을 파내어 가져왔단 말이냐?"`)
  console.log(`사신: "필멸자의 집착이란 가증스럽군. 그 죽은 심장에 내 권능을 조금 나눠주길 원하느냐?"`)

  const cost = 800
  console.log(`현재 보유 영혼의 파편: ${player.exp} / 필요 영혼의 파편: ${cost}`)

  // 2. 비용 체크
  if (player.exp < cost) {
    console.log(
      `사신: "크크크... 그 핵을 깨울 동력조차 없으면서 내 시간을 뺏는 것이냐? 가서 더 많은 죽음을 목격하고 오거라."`
    )
    return
  }

  // 3. 최종 확인 (실수 방지용)
  const warningMsg = `사신: "겨우 영혼의 파편 ${cost}개면 충분하다. 이 고철에 생기를 불어넣겠느냐?"`
  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: warningMsg,
    initial: false,
  })

  if (!proceed) {
    console.log(`사신: "흥, 그 귀한 핵을 그냥 장식품으로 쓰겠다니. 네놈 마음대로 하거라."`)
    return
  }

  // 4. 골렘 부활 및 데이터 할당
  player.exp -= cost
  player._golem = {
    id: 'golem',
    name: '하역장의 기계 골렘',
    baseMaxHp: 80,
    maxHp: 80,
    hp: 80,
    baseAtk: 50,
    atk: 50,
    baseDef: 40,
    def: 40,
    agi: 3,
    exp: 0,
    description:
      '하역장에서 수거한 핵으로 부활시킨 거대 병기입니다. 사신의 마력이 깃들어 금속 틈새로 검은 안개가 뿜어져 나옵니다.',
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
  console.log(`사신: "자, 눈을 뜨거라! 이름 없는 고철이여. 이제 네놈의 새로운 주인은 이 나약한 필멸자다!"`)
}

async function handleGetSubSpace(player: Player): Promise<boolean> {
  const SOUL_COST = 500 // 요구 영혼 수치
  const warningMsg = `💀 사신이 속삭입니다: "영혼 ${SOUL_COST}개를 바쳐 그림자의 틈새를 열겠느냐?"`

  console.log('\n--------------------------------------------------')
  console.log('🌑 [공간의 지배자] 계약 제안')
  console.log('--------------------------------------------------')

  // 1. 자원 체크
  if (player.exp < SOUL_COST) {
    console.log(`\n❌ 사신이 코웃음 칩니다: "가진 영혼의 조각이 겨우 ${player.exp}개뿐인가?"`)
    return false
  }

  try {
    // 2. enquirer를 이용한 사용자 컨펌
    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed',
      message: warningMsg,
      initial: false,
    })

    // 3. 거절 시
    if (!proceed) {
      console.log('\n"멍청한 놈, 평생 그 무거운 뼈다귀들을 직접 끌고 다니거라..."')
      return false
    }

    // 4. 계약 이행
    player.exp -= SOUL_COST
    player.unlockedSkills.push('SPACE')

    console.log('\n--------------------------------------------------')
    console.log('✨ [계약 완료]')
    console.log(`🌌 플레이어의 그림자에서 이질적인 공간이 느껴집니다. 아공간 명령어를 사용할 수 있습니다.`)
    console.log(`💡 (남은 영혼: ${player.exp} EXP)`)
    console.log('--------------------------------------------------\n')

    return true
  } catch (error) {
    // 입력 중단(Ctrl+C 등) 예외 처리
    return false
  }
}

async function handleTutorialOver(context: GameContext) {
  const { events } = context

  const dialogues = [
    '사신: "오호... 그 비릿한 오물 더미를 정말로 치우고 돌아온 건가? 용케도 사지가 붙어있군."',
    '사신: "(비릿한 조소를 띠며) 기어다니는 죄악의 단말마가 여기까지 들리더군. 칭찬이라도 기대한 것은 아니겠지? "',
    '사신: "하지만... 인정하지. 네놈의 그 처절한 발버둥이 제법 쓸만하다는 것을."',
    '사신: "이제부터는 알아서 깊은 곳의 오물들을 치우도록 해라."', // 추가된 지시
    '사신: "일을 잘한다면, 네 하찮은 능력은 조금 더 풀어줄지도 모르지."', // 계약 강조
    '사신: "네놈이 바치는 영혼의 정수가 쌓일수록, 네놈이 잊고 있던 [기술]들을 더 많이 허락해주마."',
  ]

  for (const message of dialogues) {
    await enquirer.prompt({
      type: 'input',
      name: 'confirm',
      message,
      format: () => ' (Enter ⏎)',
    })
  }

  events.completeEvent('second_talk_death')
}

export default DeathHandler
