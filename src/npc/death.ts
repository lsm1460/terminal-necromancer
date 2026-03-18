import { INIT_MAX_MEMORIZE_COUNT, SKELETON_UPGRADE } from '~/consts'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import { getPlayerSkills, SkillUtils } from '~/core/skill'
import { GameContext, Skill, SkillId } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'
import i18n from '~/i18n'

const DeathHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const { events } = context

    const isFirst = events.isCompleted('talk_death_1')
    const isSecond = events.isCompleted('talk_death_2')
    const isThird = events.isCompleted('talk_death_3')

    const isB2Completed = events.isCompleted('first_boss')
    const isB3Completed = events.isCompleted('second_boss')

    const caronFinished = events.isCompleted('defeat_caron')
    const caronReported = events.isCompleted('report_caron_to_death')

    if (caronFinished && !caronReported) {
      return [{ name: 'reportCaron', message: i18n.t('npc.death.report_charon') }]
    }

    if (!isB2Completed) {
      return [{ name: 'intro', message: i18n.t('talk.speak') }]
    }

    if (isB2Completed && !isSecond) {
      return [{ name: 'tutorialOver', message: i18n.t('talk.speak') }]
    }

    if (isB3Completed && !isThird) {
      return [{ name: 'defeatGolem', message: i18n.t('talk.speak') }]
    }

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'levelUp', message: i18n.t('npc.death.levelup') },
      { name: 'unlock', message: i18n.t('npc.death.unlock_skills') },
      { name: 'memorize', message: i18n.t('npc.death.engrave_skills') },
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
    Terminal.log(`\n${i18n.t('npc.death.intro.still_working')}`)
    return
  }

  const dialogues = i18n.t('npc.death.intro.dialogues', { returnObjects: true }) as string[]

  await speak(dialogues)

  Terminal.log(`\n${i18n.t('npc.death.intro.failure_threat')}`)

  events.completeEvent('talk_death_1')
}

// --- 서브 메뉴: 스킬 전수 ---
async function handleSkillMenu(player: Player, context: GameContext) {
  const { events } = context
  const completed = events.getCompleted()
  const playerSkills = getPlayerSkills()

  const lockableSkills = Object.values(playerSkills).filter((s) => !player.hasSkill(s.id))

  if (lockableSkills.length === 0) {
    Terminal.log(i18n.t('npc.death.skill_transfer.all_learned'))
    return
  }

  const choices = lockableSkills.map((s) => {
    const skillData = playerSkills[s.id]
    const isUnlocked = !skillData.unlocks || skillData.unlocks.every((req) => completed.includes(req))

    // 해금 여부에 따른 메시지 구성
    const message = isUnlocked
      ? `${s.name} (LV: ${skillData.requiredLevel}, SOUL: ${skillData.requiredExp})`
      : i18n.t('npc.death.skill_transfer.locked', {
          hint: skillData.unlockHint || i18n.t('npc.death.skill_transfer.default_hint'),
        })

    return {
      name: s.id,
      message,
      disabled: !isUnlocked || player.level < skillData.requiredLevel || player.exp < skillData.requiredExp,
    }
  })

  // 2. 기술 선택 메뉴
  const skillId = (await Terminal.select(i18n.t('npc.death.skill_transfer.select_prompt', { exp: player.exp }), [
    ...choices,
    { name: 'back', message: i18n.t('cancel') },
  ])) as SkillId | 'back'

  if (skillId === 'back') return

  // 3. 습득 결과 처리
  const skill = playerSkills[skillId]
  if (SkillUtils.canLearn(player, skill)) {
    player.unlockSkill(skill)
    Terminal.log(i18n.t('npc.death.skill_transfer.success', { name: skill.name }))
  } else {
    Terminal.log(i18n.t('npc.death.skill_transfer.fail'))
  }
}

async function handleLevelUp(player: Player) {
  const { required: nextExp, toNext: cost } = player.expToNextLevel()

  Terminal.log(i18n.t('npc.death.level_up.current_souls', { exp: player.exp }))

  const proceed = await Terminal.confirm(i18n.t('npc.death.level_up.confirm_offer', { cost }))

  if (!proceed) {
    Terminal.log(i18n.t('npc.death.level_up.reject_coward'))
    return
  }

  if (player.levelUp()) {
    Terminal.log(i18n.t('npc.death.level_up.success_msg', { level: player.level }))
  } else {
    Terminal.log(
      i18n.t('npc.death.level_up.fail_msg', {
        current: player.exp,
        required: nextExp,
      })
    )
  }
}

async function handleMemorize(player: Player) {
  const playerSkills = getPlayerSkills()
  const isSoulGrown = player.maxMemorize > INIT_MAX_MEMORIZE_COUNT

  // 1. 환영 메시지 및 헤더
  const welcomeMessage = isSoulGrown
    ? i18n.t('npc.death.memorize.welcome_grown')
    : i18n.t('npc.death.memorize.welcome_default')

  const divider = '──────────────────────────────────────────────────'
  Terminal.log(`\n${divider}`)
  Terminal.log(welcomeMessage)
  Terminal.log(i18n.t('npc.death.memorize.limit_info', { max: player.maxMemorize }))
  Terminal.log(`${divider}\n`)

  // 2. 선택지 구성
  const skillChoices = player.unlockedSkills
    .map((skillId) => (playerSkills as Partial<Record<SkillId | 'SPACE', Skill>>)[skillId])
    .filter((skill): skill is Skill => !!skill)
    .map((skill) => ({
      name: skill.name,
      message: i18n.t('npc.death.memorize.skill_format', {
        name: skill.name.padEnd(12),
        cost: String(skill.cost).padStart(2),
        description: skill.description,
      }),
    }))

  try {
    // 3. Terminal.multiselect 호출
    const selectedSkills = await Terminal.multiselect(
      i18n.t('npc.death.memorize.select_prompt', { max: player.maxMemorize }),
      skillChoices,
      {
        initial: player.memorize.map((skillId) => playerSkills[skillId].name),
        maxChoices: player.maxMemorize,
        validate(value: string[]) {
          if (value.length === 0) return i18n.t('npc.death.memorize.validate_min')
          if (value.length > player.maxMemorize)
            return i18n.t('npc.death.memorize.validate_max', { max: player.maxMemorize })
          return true
        },
      }
    )

    // 4. 플레이어 상태 업데이트
    player.memorize = selectedSkills.map(
      (skillName) => Object.entries(playerSkills).find(([, skill]) => skill.name === skillName)![0] as SkillId
    )

    const exitMessage = isSoulGrown
      ? i18n.t('npc.death.memorize.exit_grown')
      : i18n.t('npc.death.memorize.exit_default')

    Terminal.log(`\n${divider}`)
    Terminal.log(exitMessage)
    Terminal.log(i18n.t('npc.death.memorize.system_complete', { count: player.memorize.length }))
    Terminal.log(`${divider}\n`)
  } catch (error) {
    Terminal.log(i18n.t('npc.death.memorize.cancel'))
  }
}

async function handleTutorialOver(context: GameContext) {
  const { events } = context

  const messages = i18n.t('npc.death.tutorial_over', { returnObjects: true }) as string[]

  await speak(messages)

  events.completeEvent('talk_death_2')
}

async function handleDefeatGolem(context: GameContext) {
  const { events } = context

  const messages = i18n.t('npc.death.defeat_golem', { returnObjects: true }) as string[]

  await speak(messages)

  events.completeEvent('talk_death_3')
}

async function handleReportCaron(context: GameContext) {
  const { events } = context

  const isCaronMine = events.isCompleted('caron_is_mine')
  const isCaronDead = events.isCompleted('caron_is_dead')

  let messageKey = ''

  if (isCaronMine) {
    messageKey = 'npc.death.report_caron.deceived'
  } else if (isCaronDead) {
    messageKey = 'npc.death.report_caron.loyal'
  }

  if (messageKey) {
    const messages = i18n.t(messageKey, { returnObjects: true }) as string[]
    await speak(messages)
  }

  await speak(i18n.t('npc.death.order_go_to_b5.deceived', { returnObjects: true }) as string[])

  events.completeEvent('report_caron_to_death')
}

export default DeathHandler
