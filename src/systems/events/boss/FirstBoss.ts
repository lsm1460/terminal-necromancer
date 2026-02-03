import { CombatUnit } from '../../../core/battle/CombatUnit'
import { GameContext, GameEvent, NPC } from '../../../types'
import { BossLogic } from './BossLogic'

export class FirstBoss implements BossLogic {
  createEnemies(bossNpc: NPC, eventData: GameEvent, context: GameContext): CombatUnit[] {
    const { battle, monster } = context

    // 1. 메인 보스 추가
    const enemies: CombatUnit[] = [battle.toCombatUnit(bossNpc, 'npc')]

    // 2. 동반 몬스터가 있다면 추가
    if (eventData.withMonster) {
      const additional = monster.makeMonsters(eventData.withMonster).map((m) => battle.toCombatUnit(m, 'monster'))
      enemies.push(...additional)
    }

    return enemies
  }
}
