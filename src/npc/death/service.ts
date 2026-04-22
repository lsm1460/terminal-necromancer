import { Player } from '~/core/player/Player'
import { Skill } from '~/core/types'
import i18n from '~/i18n'
import { getPlayerSkills } from '~/systems/skill/player'
import { AppContext } from '~/systems/types'
import { SkillId } from '~/types'

export const DeathService = {
  getActiveQuest(context: AppContext) {
    const { events } = context
    const isSecond = events.isCompleted('talk_death_2')
    const isThird = events.isCompleted('talk_death_3')
    const isFourth = events.isCompleted('talk_death_4')
    const isB2Completed = events.isCompleted('first_boss')
    const isB3Completed = events.isCompleted('second_boss')
    const isB5Completed = events.isCompleted('third_boss')
    const caronFinished = events.isCompleted('defeat_caron')
    const caronReported = events.isCompleted('report_caron_to_death')

    const isB6Completed = events.isCompleted('fourth_boss')

    if (caronFinished && !caronReported) return { name: 'reportCaron', message: i18n.t('npc.death.report_charon') }
    if (!isB2Completed) return { name: 'intro', message: i18n.t('talk.speak') }
    if (isB2Completed && !isSecond) return { name: 'tutorialOver', message: i18n.t('talk.speak') }
    if (isB3Completed && !isThird) return { name: 'defeatGolem', message: i18n.t('talk.speak') }
    if (isB5Completed && !isFourth) return { name: 'cleanupVipLounge', message: i18n.t('talk.speak') }
    if (isB6Completed) return { name: 'end', message: i18n.t('talk.speak') }

    return null
  },

  getSkillUnlockChoices(context: AppContext) {
    const { player, events } = context
    const completed = events.getCompleted()
    const playerSkills = getPlayerSkills()
    const lockableSkills: Skill[] = Object.values(playerSkills).filter((s) => !player.hasSkill(s.id))

    return lockableSkills.map((s) => {
      const isUnlocked = !s.unlocks || s.unlocks.every((req) => completed.includes(req))
      const canAfford = player.level >= s.requiredLevel && player.exp >= s.requiredExp

      return {
        name: s.id,
        message: isUnlocked
          ? `${s.name} (LV: ${s.requiredLevel}, SOUL: ${s.requiredExp})`
          : i18n.t('npc.death.skill_transfer.locked', {
              hint: s.unlockHint || i18n.t('npc.death.skill_transfer.default_hint'),
            }),
        disabled: !isUnlocked || !canAfford,
      }
    })
  },

  getMemorizeChoices(player: Player) {
    const playerSkills = getPlayerSkills()

    return player.unlockedSkills
      .map((id) => (playerSkills as any)[id])
      .filter(Boolean)
      .map((s: Skill) => ({
        name: s.name,
        message: i18n.t('npc.death.memorize.skill_format', {
          name: s.name.padEnd(12),
          cost: String(s.cost).padStart(2),
          description: s.description,
        }),
      }))
  },

  getSkillIdByName(name: string) {
    const playerSkills = getPlayerSkills()
    const entry = Object.entries(playerSkills).find(([, s]) => s.name === name)
    return entry![0] as SkillId
  },
}
