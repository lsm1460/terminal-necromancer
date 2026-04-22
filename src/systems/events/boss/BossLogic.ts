import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { AppContext } from '~/systems/types'

export interface BossLogic {
  postTalk: string[]
  withMonsterGroup?: string

  createEnemies(bossNpc: BaseNPC, context: AppContext): Promise<CombatUnit[]>

  onVictory?: (bossNpc: BaseNPC, context: AppContext) => Promise<void | 'exit'>

  defeatTalk?: string[]
}
