import { SKELETON_UPGRADE } from '~/consts'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { BattleTarget, GameContext } from '~/types'
import { handleTalk, NPCHandler } from './NPCHandler'

const SubspaceHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'increaseLimit', message: i18n.t('npc.subspace.choices.increase_limit') },
      { name: 'space', message: i18n.t('npc.subspace.choices.space') },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        await handleTalk(npc)
        break
      case 'increaseLimit':
        await handleIncreaseLimit(player, context)
        break
      case 'space':
        await handleSpace(player, context)
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

export default SubspaceHandler
