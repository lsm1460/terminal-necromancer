import { SKELETON_UPGRADE } from '~/consts'
import { SKELETON_RARITIES, SkeletonFactory } from '~/core/SkeletonFactory'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { BattleTarget, GameContext } from '~/types'
import { getOriginId, speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const SubspaceHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(player, context)

    if (quest) {
      return [quest]
    }

    const { events } = context
    const isTutorialCompleted = events.isCompleted('tutorial_knight')

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'increaseLimit', message: i18n.t('npc.subspace.choices.increase_limit') },
      { name: 'space', message: i18n.t('npc.subspace.choices.space') },
      { name: 'mix', message: i18n.t('npc.subspace.choices.mix') },
      ...(isTutorialCompleted ? [{ name: 'promotion', message: i18n.t('npc.subspace.choices.promotion') }] : []),
    ]
  },
  hasQuest(player, context) {
    return getActiveQuest(player, context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        await handleTalk(npc)
        break
      case 'increaseLimit':
        await handleIncreaseLimit(player, context)
        break
      case 'tutorialPromotion':
        await handleTutorialPromotion(context)
        break
      case 'promotion':
        await handlePromotion(player, context)
        break
      case 'space':
        await handleSpace(player, context)
        break
      case 'mix':
        await handleMix(player, context)
        break
    }
  },
}

async function handleIncreaseLimit(player: Player, context: GameContext) {
  const { events } = context
  const isMine = events.isCompleted('caron_is_mine')
  const scriptKey = isMine ? 'caron_is_mine' : 'caron_is_dead'
  const t = (key: string) => i18n.t(`npc.subspace.increase_limit.${scriptKey}.${key}`)

  const currentLimit = player._maxSkeleton || SKELETON_UPGRADE.MIN_LIMIT

  if (currentLimit >= SKELETON_UPGRADE.MAX_LIMIT) {
    Terminal.log(`\n${t('max')}`)
    return
  }

  const cost = SKELETON_UPGRADE.COSTS[currentLimit]

  Terminal.log(`\n${t('cost_info')}`)
  Terminal.log(i18n.t('npc.subspace.increase_limit.status', { current: player.exp, cost }))

  if (player.exp < cost) {
    Terminal.log(`\n${t('not_enough')}`)
    return
  }

  const proceed = await Terminal.confirm(t('confirm'))

  if (!proceed) {
    Terminal.log(`\n${t('cancel')}`)
    return
  }

  player.exp -= cost
  player._maxSkeleton = currentLimit + 1

  Terminal.log(i18n.t('npc.subspace.increase_limit.success_title'))
  Terminal.log(t('success'))
  Terminal.log(i18n.t('npc.subspace.increase_limit.result', { prev: currentLimit, next: player._maxSkeleton }))
}

async function handleSpace(player: Player, context: GameContext) {
  const { events } = context
  const caronIsMine = events.isCompleted('caron_is_mine')

  if (caronIsMine) {
    Terminal.log(i18n.t('npc.subspace.manage.intro_mine'))
  } else {
    Terminal.log(i18n.t('npc.subspace.manage.intro_dead'))
  }

  const canPush = player.skeleton.length > 0 && player.skeletonSubspace.length < player.subspaceLimit
  const canPull = player.skeletonSubspace.length > 0

  const actionChoices = []
  if (canPush) actionChoices.push({ name: 'push', message: i18n.t('npc.subspace.manage.push') })
  if (canPull) actionChoices.push({ name: 'pull', message: i18n.t('npc.subspace.manage.pull') })
  actionChoices.push({ name: 'cancel', message: i18n.t('npc.subspace.manage.cancel') })

  if (actionChoices.length === 1) {
    Terminal.log(i18n.t('npc.subspace.manage.no_unit'))
    return false
  }

  const action = await Terminal.select<'push' | 'pull' | 'cancel'>(
    i18n.t('npc.subspace.manage.select_title', { current: player.skeletonSubspace.length, max: player.subspaceLimit }),
    actionChoices
  )

  if (action === 'cancel') return false

  if (action === 'push') {
    await handlePush(player)
  } else {
    await handlePull(player)
  }
}

async function handlePush(player: Player) {
  const skeletonChoices = player.skeleton.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const targetId = await Terminal.select(i18n.t('npc.subspace.manage.push_select'), skeletonChoices)

  const target = player.skeleton.find((sk) => sk.id === targetId)
  if (!target) return

  player.skeleton = player.skeleton.filter((s) => s.id !== targetId)
  player.skeletonSubspace.push(target)
  renderSuccessMessage(target.name, 'push')
}

async function handlePull(player: Player) {
  const subspaceChoices = player.skeletonSubspace.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const pullId = await Terminal.select(i18n.t('npc.subspace.manage.pull_select'), subspaceChoices)

  const targetToPull = player.skeletonSubspace.find((sk) => sk.id === pullId)
  if (!targetToPull) return

  if (player.skeleton.length >= player.subspaceLimit) {
    await handleSwap(player, targetToPull)
  } else {
    player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== pullId)
    player.addSkeleton(targetToPull)
    renderSuccessMessage(targetToPull.name, 'pull')
  }
}

async function handleSwap(player: Player, targetToPull: BattleTarget) {
  Terminal.log(i18n.t('npc.subspace.manage.swap_warn'))

  const fieldChoices = player.skeleton.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const pushId = await Terminal.select(
    i18n.t('npc.subspace.manage.swap_select', { name: targetToPull.name }),
    fieldChoices
  )

  const targetToPush = player.skeleton.find((sk) => sk.id === pushId)
  if (!targetToPush) return

  player.skeleton = player.skeleton.filter((s) => s.id !== pushId)
  player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== targetToPull.id)

  player.addSkeleton(targetToPull)
  player.skeletonSubspace.push(targetToPush)

  renderSuccessMessage(`${targetToPush.name} ↔ ${targetToPull.name}`, 'swap')
}

function renderSuccessMessage(name: string, type: 'push' | 'pull' | 'swap') {
  const keyMap = { push: 'msg_push', pull: 'msg_pull', swap: 'msg_swap' }
  Terminal.log(i18n.t(`npc.subspace.manage.${keyMap[type]}`, { name }))
}

async function handleTutorialPromotion(context: GameContext) {
  const { events } = context
  const isMine = events.isCompleted('caron_is_mine')
  const npcKey = isMine ? 'caron_is_mine' : 'caron_is_dead'

  // 튜토리얼 대사 실행 (발견의 강조)
  const lines = i18n.t(`npc.subspace.promotion.tutorial.${npcKey}`, { returnObjects: true }) as string[]
  await speak(lines)

  events.completeEvent('tutorial_knight')
}

async function handlePromotion(player: Player, context: GameContext) {
  const { events } = context
  const isMine = events.isCompleted('caron_is_mine')
  const npcKey = isMine ? 'caron_is_mine' : 'caron_is_dead'
  const getMsg = (key: string, params?: object) =>
    i18n.t(`npc.subspace.promotion.${npcKey}.${key}`, params as any) as string

  // 1. 선택지 생성
  const choices = player.skeleton.map((sk) => ({
    name: sk.id,
    message: i18n.t('skill.choice_format', {
      name: sk.name,
      hp: sk.hp,
      maxHp: sk.maxHp,
    }),
    disabled: sk.maxHp < 200, // 체력 조건
  }))

  choices.push({ name: 'cancel', message: i18n.t('cancel'), disabled: false })

  // 2. 대상 선택
  const selectTitle = i18n.t('npc.subspace.promotion.select_title')
  const selectedId = await Terminal.select(selectTitle, choices)

  if (selectedId === 'cancel') {
    Terminal.log(getMsg('cancel'))
    return
  }

  const target = player.skeleton.find((sk) => sk.id === selectedId)!

  // 3. 최종 확인 (기존 기사 교체 경고 포함)
  const proceed = await Terminal.confirm(getMsg('confirm', { name: target.name }))

  if (!proceed) {
    Terminal.log(getMsg('cancel'))
    return
  }

  // 4. 승격 실행 및 메시지 출력
  player.unlockKnight(target)
  player.removeMinion(selectedId)

  // NPC 축하 대사
  Terminal.log(getMsg('success'))

  // 시스템 결과 메시지
  Terminal.log(i18n.t('npc.subspace.promotion.system.result', { name: target.name }))
}

async function handleMix(player: Player, context: GameContext) {
  const { events } = context
  const isMine = events.isCompleted('caron_is_mine')

  const npcKey = isMine ? 'caron_is_mine' : 'caron_is_dead'
  const getMsg = (key: string, params?: any) => i18n.t(`npc.subspace.mix.${npcKey}.${key}`, params) as string

  if (!events.isCompleted('tutorial_mix')) {
    const tutorialLines = i18n.t(`npc.subspace.mix.tutorial.${npcKey}`, { returnObjects: true }) as string[]
    await speak(tutorialLines)
    events.completeEvent('tutorial_mix')
  }

  const counts = player.skeleton.reduce(
    (acc, item) => {
      const prefix = getOriginId(item.id)
      acc[prefix] = (acc[prefix] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const canMix = Object.values(counts).some((count) => count >= 2)

  if (!canMix) {
    Terminal.log(getMsg('no_materials'))
    return
  }

  const choices = player.skeleton.map((sk) => ({
    name: sk.id,
    message: i18n.t('skill.choice_format', {
      name: sk.name,
      hp: sk.hp,
      maxHp: sk.maxHp,
    }),
  }))

  const selectTitle = i18n.t('npc.subspace.mix.select_title')
  const skeletonIdList = await Terminal.multiselect(selectTitle, choices, {
    maxChoices: 2,
  })

  // 2개 선택 안 함
  if (skeletonIdList.length < 2) {
    Terminal.log(getMsg('not_enough_selection'))
    return
  }

  const selected = player.skeleton.filter((sk) => skeletonIdList.includes(sk.id)).sort((a, b) => b.hp - a.hp)
  const targetClass = getOriginId(selected[0].id)
  const isSameClass = selected.every((sk) => getOriginId(sk.id) === targetClass)

  // 다른 클래스 섞음
  if (!isSameClass) {
    Terminal.log(getMsg('mismatch'))
    return
  }

  const target = selected[0]

  const proceed = await Terminal.confirm(getMsg('confirm', { hp: target.hp, maxHp: target.maxHp }))

  if (!proceed) {
    Terminal.log(getMsg('cancel'))
    return
  }

  const minIdx = SKELETON_RARITIES.indexOf(target.rarity!) + 1 || 1
  
  const skeleton = SkeletonFactory.createFromCorpse(target, minIdx)

  selected.forEach((sk) => player.removeMinion(sk.id))
  player.addSkeleton(skeleton)

  Terminal.log(i18n.t(`npc.subspace.mix.system.result`, { name: i18n.t(`npc.${getOriginId(skeleton.id || '')}.name`) }))
  Terminal.log(getMsg('success'))
}

function getActiveQuest(player: Player, context: GameContext) {
  const { events } = context

  const hasStrongSkeleton = player.skeleton.some((sk) => sk.maxHp >= 200)
  const isTutorialCompleted = events.isCompleted('tutorial_knight')

  if (hasStrongSkeleton && !isTutorialCompleted) {
    return { name: 'tutorialPromotion', message: i18n.t('npc.subspace.choices.tutorial_knight') }
  }

  return null
}

export default SubspaceHandler
