import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { GameContext } from '~/core/types'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { NPC } from '~/types'

export interface BossLogic {
  postTalk: string[]
  withMonsterGroup?: string

  createEnemies(bossNpc: NPC, context: GameContext): Promise<CombatUnit[]>

  onVictory?: (bossNpc: NPC, context: GameContext<Necromancer>) => Promise<void | 'exit'>

  defeatTalk?: string[]
}
