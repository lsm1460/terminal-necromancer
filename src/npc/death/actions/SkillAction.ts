import { Terminal } from '~/core'
import i18n from '~/i18n'
import { getPlayerSkills, SkillUtils } from '~/systems/skill/player'
import { AppContext } from '~/systems/types'
import { SkillId } from '~/types'
import { DeathService } from '../service'

export const SkillActions = {
  async handleUnlock(context: AppContext) {
    const choices = DeathService.getSkillUnlockChoices(context)

    if (choices.length === 0) {
      Terminal.log(i18n.t('npc.death.skill_transfer.all_learned'))
      return true
    }

    const skillId = await Terminal.select(i18n.t('npc.death.skill_transfer.select_prompt', { exp: context.player.exp }), [
      ...choices,
      { name: 'back', message: i18n.t('cancel') },
    ])

    if (skillId === 'back') return true

    const playerSkills = getPlayerSkills()
    const skill = playerSkills[skillId as SkillId]

    if (SkillUtils.canLearn(context.player, skill)) {
      context.player.unlockSkill(skill)
      Terminal.log(i18n.t('npc.death.skill_transfer.success', { name: skill.name }))
    } else {
      Terminal.log(i18n.t('npc.death.skill_transfer.fail'))
    }
    return true
  },
}