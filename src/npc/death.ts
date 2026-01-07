import enquirer from 'enquirer'
import { Player } from '../core/Player'
import { SKILL_LIST, SkillUtils } from '../core/skill'
import { SkillId } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'

const DeathHandler: NPCHandler = {
  getChoices() {
    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'levelUp', message: '✨ 레벨업' },
      { name: 'skillUnlock', message: '🔮 기술 전수' },
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
      case 'skillUnlock':
        await handleSkillMenu(player)
        break
      default:
        break
    }
  },
}

// --- 서브 메뉴: 스킬 전수 ---
async function handleSkillMenu(player: Player) {
  const lockableSkills = Object.values(SKILL_LIST).filter((s) => !player.hasSkill(s.id))
  if (lockableSkills.length === 0) {
    console.log('\n[알림] 이미 모든 기술을 터득하셨습니다.')
    return
  }

  const choices = [
    ...lockableSkills.map((s) => ({
      name: s.id, // 내부 값
      message: `${s.name} (LV ${SKILL_LIST[s.id].requiredLevel})`, // 표시될 이름
    })),
    { name: 'back', message: '🔙 뒤로 가기' },
  ]

  // 1. Enquirer Select 메뉴 생성
  const response = await enquirer.prompt({
    type: 'select',
    name: 'skillId',
    message: '전수받을 기술을 선택하세요:',
    choices,
    format: (value) => {
      const selected = choices.find((c) => c.name === value)

      return selected ? selected.message : value
    },
  })

  const skillId = (response as { skillId: string }).skillId

  if (skillId === 'back') {
    return
  }

  const _skillId = skillId as SkillId

  if (SkillUtils.canLearn(player, _skillId)) {
    player.unlockSkill(_skillId)
    console.log(`\n💀 [습득] '${SKILL_LIST[_skillId].name}' 기술을 배웠습니다!`)
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

export default DeathHandler
