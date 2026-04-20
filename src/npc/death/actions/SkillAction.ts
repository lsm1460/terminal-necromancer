import { INIT_MAX_MEMORIZE_COUNT } from '~/consts'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { getPlayerSkills, SkillUtils } from '~/systems/skill/player'
import { GameContext, SkillId } from '~/types'
import { DeathService } from '../service'

export const SkillActions = {
  async handleUnlock(context: GameContext) {
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

  async handleMemorize(player: Necromancer) {
    const playerSkills = getPlayerSkills()
    const isSoulGrown = player.maxMemorize > INIT_MAX_MEMORIZE_COUNT
    const welcomeMessage = isSoulGrown ? i18n.t('npc.death.memorize.welcome_grown') : i18n.t('npc.death.memorize.welcome_default')
    
    Terminal.log(`\n${welcomeMessage}\n${i18n.t('npc.death.memorize.limit_info', { max: player.maxMemorize })}`)

    const skillChoices = DeathService.getMemorizeChoices(player)

    try {
      const selectedNames = await Terminal.multiselect(
        i18n.t('npc.death.memorize.select_prompt', { max: player.maxMemorize }),
        skillChoices,
        { 
          initial: player.memorize.map(id => playerSkills[id].name), 
          maxChoices: player.maxMemorize 
        }
      )

      player.memorize = selectedNames.map(name => DeathService.getSkillIdByName(name))
      Terminal.log(i18n.t('npc.death.memorize.system_complete', { count: player.memorize.length }))
    } catch {
      Terminal.log(i18n.t('npc.death.memorize.cancel'))
    }
    return true
  }
}