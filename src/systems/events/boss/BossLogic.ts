import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext } from '~/core/types'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'

export interface BossLogic {
  postTalk: string[]
  withMonsterGroup?: string

  createEnemies(bossNpc: BaseNPC, context: GameContext): Promise<CombatUnit[]>

  onVictory?: (bossNpc: BaseNPC, context: GameContext) => Promise<void | 'exit'>

  defeatTalk?: string[]
}
