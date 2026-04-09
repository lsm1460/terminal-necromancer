import { SKELETON_RARITIES, SkeletonFactory } from '~/core/SkeletonFactory'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { Corpse, ExecuteSkill } from '~/types'
import { getOriginId } from '~/utils'
import { SkillManager } from '../SkillManager'

export const raiseSkeleton: ExecuteSkill = async (player, context) => {
  const failure = {
    isSuccess: false,
    isAggressive: false,
    gross: 0,
  }
  const { world, npcs } = context

  const makeSkeleton = (corpse: Corpse, isMultiple?: boolean) => {
    const minIdx = Math.min(
      SKELETON_RARITIES.indexOf(corpse?.minRebornRarity || 'common') + player.ref.minRebornRarity,
      SKELETON_RARITIES.length - 2
    )

    const skeleton = SkeletonFactory.createFromCorpse(corpse, minIdx)

    // 4. 플레이어에게 추가 및 세계에서 시체 제거
    if (player.ref.addSkeleton(skeleton)) {
      world.removeCorpse(corpse.id)
      npcs.reborn(corpse.id)

      Terminal.log(i18n.t('skill.RAISE_SKELETON.reborn_start', { name: corpse.name }))
      Terminal.log(
        i18n.t('skill.RAISE_SKELETON.reborn_success', {
          rarity: skeleton.name.split(' skeleton ')[0], // 이름에서 래리티 태그 추출
          class: i18n.t(`npc.${getOriginId(skeleton.id || '')}.name`),
        })
      )

      return true
    }

    if (!isMultiple) {
      Terminal.log(i18n.t('skill.RAISE_SKELETON.notice_limit'))
    }

    return false
  }

  const corpses = world.getCorpsesAt(player.ref.pos)

  if (corpses.length === 0) {
    Terminal.log(i18n.t('skill.RAISE_SKELETON.no_corpse'))
    return { ...failure }
  }

  if (player.ref.skeleton.length >= player.ref.maxSkeleton) {
    Terminal.log(i18n.t('skill.RAISE_SKELETON.limit_reached'))
    return { ...failure }
  }

  let isSuccess = false

  if (player.ref.hasAffix('LEGION')) {
    Terminal.log(i18n.t('skill.RAISE_SKELETON.legion_activation'))

    isSuccess = corpses.map((_corpse) => makeSkeleton(_corpse, true)).some(Boolean)

    if (isSuccess) {
      Terminal.log(i18n.t('skill.RAISE_SKELETON.legion_success'))
    }
  } else {
    const targetId = await SkillManager.selectCorpse(player.ref, context)
    const selectedCorpse = corpses.find((c) => c.id === targetId)

    if (!selectedCorpse) {
      Terminal.log(i18n.t('skill.not_found'))
      return { ...failure }
    }

    isSuccess = makeSkeleton(selectedCorpse)
  }

  if (isSuccess) {
    return {
      isSuccess: true,
      isAggressive: false,
      gross: 20,
    }
  }

  return { ...failure }
}
