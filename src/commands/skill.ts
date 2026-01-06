import { SkillManager } from '../core/skill'
import { CommandFunction } from '../types'

export const skillCommand: CommandFunction = async (player, args, context) => {
  await SkillManager.requestAndExecuteSkill(player, context)

  return false
}
