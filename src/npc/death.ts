import enquirer from 'enquirer'
import { Player } from '../core/Player'
import { SKILL_LIST, SkillUtils } from '../core/skill'
import { GameContext, SkillId } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'
import { INIT_MAX_MEMORIZE_COUNT } from '../consts'

const DeathHandler: NPCHandler = {
  getChoices() {
    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'levelUp', message: '✨ 레벨업' },
      { name: 'unlock', message: '🔮 기술 전수' },
      { name: 'memorize', message: '📜 기술 각인' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'levelUp':
        handleLevelUp(player)
        break
      case 'unlock':
        await handleSkillMenu(player, context)
        break
      case 'memorize':
        await handleMemorize(player)
        break
      default:
        break
    }
  },
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
        ? `${s.name} (LV ${skillData.requiredLevel})`
        : `??? (해금 조건: ${skillData.unlockHint || '특정 조건 달성'}) 🔒`,
      disabled: !isUnlocked || player.level < skillData.requiredLevel,
    }
  })

  // 1. Enquirer Select 메뉴 생성
  const { skillId } = await enquirer.prompt<{ skillId: SkillId | 'back' }>({
    type: 'select',
    name: 'skillId',
    message: '전수받을 기술을 선택하세요:',
    choices: [...choices, { name: 'back', message: '🔙 뒤로 가기' }],
    format: (value) => {
      const selected = choices.find((c) => c.name === value)

      return selected ? selected.message : value
    },
  })

  if (skillId === 'back') {
    return
  }

  if (SkillUtils.canLearn(player, skillId)) {
    player.unlockSkill(skillId)
    console.log(`\n💀 [습득] '${SKILL_LIST[skillId].name}' 기술을 배웠습니다!`)
  } else {
    console.log(`\n[실패] 요구 조건을 충족하지 못했습니다.`)
  }
}

function handleLevelUp(player: Player) {
  // 레벨업 로직...
  console.log('\n[알림] 아직 레벨업 기능이 구현되지 않았습니다.')

  if (player.levelUp()) {
    console.log(`\n✨ 축하합니다! 레벨이 올랐습니다. (현재 LV.${player.level})`)
  } else {
    const nextExp = player.expToNextLevel()
    console.log(`\n[실패] 경험치가 부족합니다. (현재: ${player.exp}/${nextExp})`)
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
  const skillChoices = player.unlockedSkills.map((skillId) => {
    const skill = SKILL_LIST[skillId]

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

export default DeathHandler
