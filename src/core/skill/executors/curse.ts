import { GameContext, SkillResult } from '../../../types'
import { CombatUnit } from '../../Battle'
import { Player } from '../../Player'
import enquirer from 'enquirer'

/**
 * 저주 (Curse)
 * : 1명을 선택하여 공격력 감소 [5% 나머지는 버림]를 3턴동안 부여
 */
export const curse = async (
  player: CombatUnit<Player>,
  context: GameContext,
  enemies: CombatUnit[] = []
): Promise<SkillResult> => {

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 90,
  }
}
