import i18n from '~/i18n'
import { ExecuteSkill, GameContext, SkillId, SkillResult } from '~/types'
import { Terminal } from '../Terminal'
import { Player } from '../player/Player'
import { getPlayerSkills } from './skill'

type EnhancedSkillResult =
  | (SkillResult & { isSuccess: boolean; skillId: string })
  | (SkillResult & { isSuccess: false; skillId?: undefined })

export class SkillManager {
  static requestAndExecuteSkill: (...args: Parameters<ExecuteSkill>) => Promise<EnhancedSkillResult> = async (
    player,
    context,
    units
  ) => {
    const failResult = { isSuccess: false, isAggressive: false, gross: 0 } as const

    // 1. 가능 스킬 필터링
    const playerSkills = getPlayerSkills()
    const availableSkills = Object.values(playerSkills).filter((skill) => player.ref.memorize.includes(skill.id))

    // 2. 스킬 선택 UI
    const skillId = await Terminal.select(i18n.t('skill.select_title', { mp: player.ref.mp }), [
      ...availableSkills.map((s) => ({
        name: s.id,
        message: `${s.name} (MP: ${s.cost}) - ${s.description}`,
      })),
      { name: 'cancel', message: i18n.t('cancel') },
    ])

    if (skillId === 'cancel') return failResult

    const targetSkill = playerSkills[skillId as SkillId]

    // 3. 자원 체크
    if (player.ref.mp < targetSkill.cost) {
      Terminal.log(`\n🚫 ${i18n.t('skill.not_enough_mp', { cost: targetSkill.cost, current: player.ref.mp })}`)
      return failResult
    }

    const result = await targetSkill.execute(player, context, units)

    // 4. 실행 및 마력 소모
    if (result.isSuccess) {
      player.ref.mp -= targetSkill.cost
    }

    return { ...result, skillId }
  }

  static async selectCorpse(player: Player, context: GameContext) {
    const corpses = context.world.getCorpsesAt(player.pos.x, player.pos.y)

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
      { name: 'cancel', message: `🔙 ${i18n.t('cancel')}` },
    ]

    const corpseId = await Terminal.select(i18n.t('skill.select_corpse_to_consume'), corpseChoices)

    if (corpseId === 'cancel') {
      Terminal.log('\n💬 ' + i18n.t('skill.cancel_action'))
      return false
    }

    return corpseId
  }
}
