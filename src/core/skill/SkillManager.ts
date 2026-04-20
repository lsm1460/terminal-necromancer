import i18n from '~/i18n'
import { Terminal } from '../Terminal'
import { ExecuteSkill, SkillResult } from '../types'

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
  static requestAndExecuteSkill: (...args: Parameters<ExecuteSkill>) => Promise<EnhancedSkillResult> = async (
    player,
    context,
    units
  ) => {
    const resource = player.ref.getResourceStatus()
    const failResult = { isSuccess: false, isAggressive: false, gross: 0 } as const

    const availableSkills = player.ref.getLearnedSkills()

    const skillId = await Terminal.select(
      { key: 'skill.select_title', args: { type: resource.type, cost: resource.value } },
      [
        ...availableSkills.map((s) => ({
          name: s.id,
          message: `${s.name} (${resource.type}: ${s.cost}) - ${s.description}`,
        })),
        { name: 'cancel', message: i18n.t('cancel') },
      ]
    )

    if (skillId === 'cancel') return failResult

    const targetSkill = availableSkills.find((s) => s.id === skillId)
    if (!targetSkill) return failResult

    if (!player.ref.canPay(targetSkill.cost)) {
      Terminal.log({
        key: 'skill.not_enough',
        args: { type: resource.type, cost: targetSkill.cost, current: resource.value },
      })
      return failResult
    }

    const result = await targetSkill.execute(player, context, units)

    return { ...result, skillId: skillId as string } as EnhancedSkillResult
  }
}
