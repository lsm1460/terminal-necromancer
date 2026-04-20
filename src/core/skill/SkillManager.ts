import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { SkillId } from '~/types'
import { Terminal } from '../Terminal'
import { World } from '../World'
import { CombatUnit } from '../battle/unit/CombatUnit'
import { Player } from '../player/Player'
import { ExecuteSkill, SkillResult } from '../types'
import { getPlayerSkills } from './skill'

type BaseSkillInfo = {
  isAggressive: boolean
  gross: number
}

type EnhancedSkillResult = (
  | (SkillResult & { isSuccess: true; skillId: string })
  | (SkillResult & { isSuccess: false; skillId?: undefined })
) &
  BaseSkillInfo

export class SkillManager {
  static requestAndExecuteSkill: (...args: Parameters<ExecuteSkill>) => Promise<EnhancedSkillResult> =
    async (player, context, units) => {
      const playableUnit = player as unknown as CombatUnit<Necromancer>
      const isConsumeBlood = playableUnit.ref.hasAffix('BLOOD')
      const costType = isConsumeBlood ? 'HP' : 'MP'

      const currentResource = isConsumeBlood ? playableUnit.ref.hp : playableUnit.ref.mp

      const failResult = { isSuccess: false, isAggressive: false, gross: 0 } as const

      const playerSkills = getPlayerSkills()
      const availableSkills = Object.values(playerSkills).filter((skill) =>
        playableUnit.ref.memorize.includes(skill.id as SkillId)
      )

      const skillId = await Terminal.select(i18n.t('skill.select_title', { type: costType, cost: currentResource }), [
        ...availableSkills.map((s) => ({
          name: s.id,
          message: `${s.name} (${costType}: ${s.cost}) - ${s.description}`,
        })),
        { name: 'cancel', message: i18n.t('cancel') },
      ])

      if (skillId === 'cancel') return failResult

      const targetSkill = playerSkills[skillId as SkillId]

      if (currentResource < targetSkill.cost) {
        Terminal.log(
          `\n🚫 ${i18n.t('skill.not_enough', {
            type: costType,
            cost: targetSkill.cost,
            current: currentResource,
          })}`
        )
        return failResult
      }

      const result = await targetSkill.execute(player, context, units)

      if (result.isSuccess) {
        if (isConsumeBlood) {
          player.ref.hp -= targetSkill.cost
        } else {
          player.ref.mp -= targetSkill.cost
        }
      }

      return { ...result, skillId } as EnhancedSkillResult
    }

  static async selectCorpse(player: Player, world: World) {
    const corpses = world.getCorpsesAt(player.pos)

    if (corpses.length === 0) {
      Terminal.log('\n💬 ' + i18n.t('skill.no_corpses_nearby'))
      return false
    }

    const corpseChoices = [
      ...corpses.map((c, index) => ({
        name: c.id || index.toString(),
        message: i18n.t('skill.corpse_choice_format', {
          name: c.name,
          hp: c.maxHp,
          atk: c.atk,
        }),
      })),
      { name: 'cancel', message: i18n.t('cancel') },
    ]

    const corpseId = await Terminal.select(i18n.t('skill.select_corpse_to_consume'), corpseChoices)

    if (corpseId === 'cancel') {
      Terminal.log('\n💬 ' + i18n.t('skill.cancel_action'))
      return false
    }

    return corpseId
  }
}
