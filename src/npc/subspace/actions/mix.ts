import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import { getOriginId } from '~/core/utils'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { SKELETON_RARITIES, SkeletonFactory } from '~/systems/skill/player/necromancer/SkeletonFactory'
import { speak } from '~/utils'
import { SubspaceService } from '../service'

export const handleMix = async (context: GameContext<Necromancer>) => {
  const { player, events } = context
  const isDead = events.isCompleted('caron_is_dead')
  const npcKey = isDead ? 'caron_is_dead' : 'caron_is_mine'
  const getMsg = (key: string, p?: any) => i18n.t(`npc.subspace.mix.${npcKey}.${key}`, p) as string

  // 튜토리얼 체크
  if (!events.isCompleted('tutorial_mix')) {
    await speak(i18n.t(`npc.subspace.mix.tutorial.${npcKey}`, { returnObjects: true }) as string[])
    events.completeEvent('tutorial_mix')
  }

  if (!SubspaceService.getMixableGroups(player)) {
    Terminal.log(getMsg('no_materials'))
    return
  }

  const selectedIds = await Terminal.multiselect(
    i18n.t('npc.subspace.mix.select_title'),
    player.skeleton.map((sk) => ({ name: sk.id, message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})` })),
    { maxChoices: 2 }
  )

  if (selectedIds.length < 2) return

  const selected = player.skeleton.filter((sk) => selectedIds.includes(sk.id)).sort((a, b) => b.maxHp - a.maxHp)
  if (getOriginId(selected[0].id) !== getOriginId(selected[1].id)) {
    Terminal.log(getMsg('mismatch'))
    return
  }

  const chance = SubspaceService.getMixSuccessChance(selected[0].rarity)
  if (chance === 0) return Terminal.log(getMsg('max_rarity'))

  if (
    await Terminal.confirm(
      getMsg('confirm', { hp: selected[0].hp, maxHp: selected[0].maxHp, chance: Math.floor(chance * 100) })
    )
  ) {
    if (Math.random() < chance) {
      selected.forEach((sk) => player.removeMinion(sk.id))
      const nextIdx = SKELETON_RARITIES.indexOf(selected[0].rarity || 'common') + 1
      const newSk = SkeletonFactory.createFromCorpse(selected[0], nextIdx)
      player.addSkeleton(newSk)
      Terminal.log(getMsg('success'))
    } else {
      player.removeMinion(selected[1].id) // 실패 시 재료 하나 소멸
      Terminal.log(getMsg('fail'))
    }
  }
}
