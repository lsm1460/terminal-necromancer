import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import SkeletonWrapper from '~/systems/job/necromancer/SkeletonWrapper'
import { GameContext } from '~/types'

export const handleManageSpace = async (context: GameContext) => {
  const { player, events } = context
  const caronIsDead = events.isCompleted('caron_is_dead')

  Terminal.log(i18n.t(`npc.subspace.manage.intro_${caronIsDead ? 'dead' : 'mine'}`))

  const choices = [
    ...(player.skeleton.length > 0 && player.skeletonSubspace.length < player.subspaceLimit
      ? [{ name: 'push', message: i18n.t('npc.subspace.manage.push') }]
      : []),
    ...(player.skeletonSubspace.length > 0 ? [{ name: 'pull', message: i18n.t('npc.subspace.manage.pull') }] : []),
    { name: 'cancel', message: i18n.t('npc.subspace.manage.cancel') },
  ]

  const action = await Terminal.select(
    i18n.t('npc.subspace.manage.select_title', { current: player.skeletonSubspace.length, max: player.subspaceLimit }),
    choices
  )

  if (action === 'push') await executePush(player)
  if (action === 'pull') await executePull(player)
}

async function executePush(player: Necromancer) {
  const targetId = await Terminal.select(i18n.t('npc.subspace.manage.push_select'), [
    ...player.skeleton.map((sk) => ({ name: sk.id, message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})` })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  if (targetId === 'cancel') return
  const target = player.skeleton.find((sk) => sk.id === targetId)
  if (!target) return

  player.removeMinion(targetId)
  player.skeletonSubspace.push(target.raw)
  Terminal.log(i18n.t('npc.subspace.manage.msg_push', { name: target.name }))
}

async function executePull(player: Necromancer) {
  const targetId = await Terminal.select(i18n.t('npc.subspace.manage.pull_select'), [
    ...player.skeletonSubspace.map((sk) => ({
      name: sk.id,
      message: `${SkeletonWrapper.getSkeletonName(sk)} (HP: ${sk.hp}/${sk.maxHp})`,
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  if (targetId === 'cancel') return
  const targetData = player.skeletonSubspace.find((sk) => sk.id === targetId)
  if (!targetData) return

  if (player.skeleton.length >= player.maxSkeleton) {
    // 필드가 가득 찼으면 Swap 실행
    const fieldId = await Terminal.select(
      i18n.t('npc.subspace.manage.swap_select', { name: SkeletonWrapper.getSkeletonName(targetData) }),
      player.skeleton.map((sk) => ({ name: sk.id, message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})` }))
    )
    const fieldTarget = player.skeleton.find((sk) => sk.id === fieldId)!
    player.removeMinion(fieldId)
    player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== targetId)
    player.addSkeleton(targetData)
    player.skeletonSubspace.push(fieldTarget.raw)
    Terminal.log(
      i18n.t('npc.subspace.manage.msg_swap', {
        name: `${fieldTarget.name} ↔ ${SkeletonWrapper.getSkeletonName(targetData)}`,
      })
    )
  } else {
    player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== targetId)
    player.addSkeleton(targetData)
    Terminal.log(i18n.t('npc.subspace.manage.msg_pull', { name: SkeletonWrapper.getSkeletonName(targetData) }))
  }
}
