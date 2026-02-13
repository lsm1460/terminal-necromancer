import enquirer from 'enquirer'
import { INIT_MAX_MEMORIZE_COUNT, SKELETON_UPGRADE } from '../consts'
import { Player } from '../core/Player'
import { SKILL_LIST, SkillUtils } from '../core/skill'
import { GameContext, Skill, SkillId } from '../types'
import { speak } from '../utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const DeathHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const { events } = context

    const isFirst = events.isCompleted('talk_death_1')
    const isSecond = events.isCompleted('talk_death_2')
    const isThird = events.isCompleted('talk_death_3')

    const isB2Completed = events.isCompleted('first_boss')
    const isB3Completed = events.isCompleted('second_boss')

    const caronIsMine = events.isCompleted('caron_is_mine')
    const caronIsDead = events.isCompleted('caron_is_dead')
    const caronFinished = caronIsMine || caronIsDead
    const caronReported = events.isCompleted('report_caron_to_death')

    if (caronFinished && !caronReported) {
      return [{ name: 'reportCaron', message: '💀 카론의 행방에 대하여 보고' }]
    }

    if (!isB2Completed) {
      return [{ name: 'intro', message: '💬 대화' }]
    }

    if (isB2Completed && !isSecond) {
      return [{ name: 'tutorialOver', message: '💬 대화' }]
    }

    if (isB3Completed && !isThird) {
      return [{ name: 'defeatGolem', message: '💬 대화' }]
    }

    if (caronFinished && !caronReported) {
      return [{ name: 'reportCaron', message: '💀 카론의 행방에 대하여 보고' }]
    }

    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'levelUp', message: '✨ 레벨업' },
      ...(caronIsDead ? [{ name: 'increaseLimit', message: '🦴 해골 군단 확장' }] : []),
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
      case 'defeatGolem':
        await handleDefeatGolem(context)
        break
      case 'reportCaron':
        await handleReportCaron(context)
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
      default:
        break
    }
  },
}

async function handleIntro(context: GameContext) {
  const { events } = context

  const isFirst = context.events.isCompleted('talk_death_1')
  const isB2Completed = context.events.isCompleted('first_boss')

  if (isFirst && !isB2Completed) {
    console.log(`\n사신: "아직도 청소를 끝내지 못했나? 끝내고 나면 내게 돌아오도록.."`)
    return
  }

  await speak([
    '사신: "아직도 그 오만한 눈빛이라니. 네놈이 다스리던 제국의 흙먼지라도 묻어있는 줄 아는 모양이군."',
    '사신: "착각하지 마라.\n이곳 터미널에선 너 또한 심판을 기다리며 줄을 서야 하는 흔해 빠진 망자 중 하나일 뿐이다."',
    '사신: "살아남고 싶다면 네놈이 그토록 경멸하던 노역부터 시작해라.\n마침 지하 2층 환승로에 아주 역겨운 게 자라나서 말이지."',
    '사신: "[기어다니는 죄악, 벨페고르].\n제 분수를 모르고 심판을 피해 도망친 영혼들이 서로 엉겨 붙어 탄생한 기괴한 고기 덩어리다."',
    '사신: "그 비천한 것들이 환승로 선로를 점거하고 비명을 지르는 통에 영혼들의 운송이 지체되고 있어."',
    '사신: "가서 그 오물들을 도려내라. 네놈의 그 녹슨 낫이 아직 영혼의 껍질이라도 썰 수 있다면 말이야."',
    '사신: "[아래]로 내려가면 지하로 내려갈 수 있는 엘리베이터가 있다. 청소를 끝내면 나에게 와서 보고하도록.."',
  ])

  console.log(
    `\n사신: \"실패하면? 걱정 마라. 네놈의 혼령 또한 저 고기 덩어리의 일부가 되어 영원히 선로나 닦게 될 테니까. 하하하!\"`
  )

  events.completeEvent('talk_death_1')
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

  console.log(`현재 가지고 있는 영혼 조각: `, player.exp)

  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: `${cost}개의 영혼 조각을 바친다면, 네 전성기의 힘을 조금이나마 되돌아올지도 모르지..`,
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

async function handleTutorialOver(context: GameContext) {
  const { events } = context

  await speak([
    '사신: "오호... 그 비릿한 오물 더미를 치우고 온건가? 용케도 사지가 붙어있군."',
    '사신: "(비릿한 조소를 띠며) 기어다니는 죄악의 단말마가 여기까지 들리더군.\n칭찬이라도 기대한 것은 아니겠지? "',
    '사신: "하지만... 인정하지. 네놈의 그 처절한 발버둥이 제법 쓸만하다는 것을."',
    '사신: "이제부터는 알아서 깊은 곳의 오물들을 치우도록 해라."', // 추가된 지시
    '사신: "일을 잘한다면, 네 하찮은 능력은 조금 더 풀어줄지도 모르지."', // 계약 강조
    '사신: "네놈이 바치는 영혼의 정수가 쌓일수록, 네놈이 잊고 있던 [기술]들을 더 많이 허락해주마."',
  ])

  events.completeEvent('talk_death_2')
}

async function handleDefeatGolem(context: GameContext) {
  const { events } = context

  await speak([
    '사신: "오호... 청소하라고 보냈더니, 아예 하역장의 골렘을 고철 덩어리로 만들어놨군."',
    '사신: "(차가운 눈빛으로 당신을 훑으며) 네놈의 그 무식한 손버릇은 여전하구나. \n그 골렘을 수복하는 데 얼마나 많은 정수가 드는지 알고는 있는 거냐?"',
    '사신: "쯧... 좋다. 이미 부서진 고철을 탓해서 무엇하겠나. \n지금은 그보다 더 \'악취 나는 오물\'을 치워야겠다."',
    '사신: "감히 내 눈을 속이고 제 핏줄을 아공간으로 빼돌리려던 쥐새끼가 한 마리 있었지. \n그 자식 놈은 내 손에 직접 소멸당했거늘, 아비라는 놈은 아직도 미련을 버리지 못한 모양이야."',
    '사신: "지금 당장 지하 4층으로 내려가라. \n그 폐기된 구역 깊숙한 곳으로 도망쳐 숨어있는 전직 하급 관리, [카론]을 찾아내."',
    '사신: "가서 그놈의 숨통을 끊고 영혼 조각을 내 앞에 가져와라. \n더러운 배신자에게 어울리는 최후는 오직 완전한 \'무(無)\'로 돌아가는 것뿐이니까."',
    '사신: "기억해라. 이번에도 일을 복잡하게 만들었다간... \n그놈이 겪은 절망을 네놈의 그림자 속에 그대로 새겨주마. 당장 꺼져라."',
  ])

  events.completeEvent('talk_death_3')
}

async function handleReportCaron(context: GameContext) {
  const { events } = context

  // 카론의 상태 확인
  const isCaronMine = events.isCompleted('caron_is_mine')
  const isCaronDead = events.isCompleted('caron_is_dead')

  if (isCaronMine) {
    // --- 카론과 동맹을 맺고 기만용 파편을 가져온 경우 ---
    await speak([
      '사신: "결국 그 도망자를 찾아냈군. 아공간의 틈새로 숨어드는 쥐새끼를 잡아내느라 수고했다."',
      '사신: "(당신이 건넨 기만용 파편을 허공에 띄워 훑어보며) ...음."',
      '사신: "이 영혼의 빛깔... 어딘가 옅군. 본인의 의지가 결여된 채 강제로 뜯겨나온 파편이라 그런 것인가."',
      '사신: "(당신의 눈을 꿰뚫어 보듯 응시하며) 아니면, 아직도 주인을 배신할 궁리를 하는 잔재가 남아서인가?"',
      '사신: "...뭐, 상관없다. 영혼의 본질이 이곳에 회수되었다는 사실이 중요하지."',
    ])
  } else if (isCaronDead) {
    // --- 카론을 실제로 처치하고 진품 파편을 가져온 경우 ---
    await speak([
      '사신: "돌아왔군. 명부에 기록된 카론의 이름 위에 비로소 완전한 종지부가 찍혔음을 확인했다."',
      '사신: "(차갑게 식은 파편을 손가락으로 가리키며) 자식을 잃은 슬픔에 눈이 멀어 섭리를 거스르려던 관리자의 최후다."',
      '사신: "너는 사적인 감정이라는 얼룩을 아주 말끔히 닦아내었구나."',
      '사신: "약조한 대로, 네가 가져온 이 정수를 네 영혼의 족쇄를 푸는 열쇠로 쓰겠다."',
      '사신: "(낫 끝이 당신의 가슴을 스치자, 억눌려 있던 군주의 기운이 요동칩니다.)"',
      '사신: "네가 과거 대륙을 호령하며 부렸던 그 거대한 군세... 그 힘의 일부를 다시 허락하마."',
      '사신: "앞으로도 규율을 어기는 자들의 영혼 조각을 회수해 오너라. 조각이 모일 때마다 네가 잃어버렸던 군주의 권능을 하나씩 되돌려주지."',
    ])
  }

  // 보고 완료 플래그 세팅
  events.completeEvent('report_caron_to_death')
}
export default DeathHandler
