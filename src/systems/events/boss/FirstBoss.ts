import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { GameContext, NPC } from '~/types'
import { BossLogic } from './BossLogic'
import i18n from '~/i18n'

export class FirstBoss implements BossLogic {
  withMonsterGroup = 'monster-group-b2-boss'

  get postTalk() {
    return i18n.t('npc.first_boss.postTalk', { returnObjects: true }) as string[]
  }

  get defeatTalk() {
    return i18n.t('npc.first_boss.defeatTalk', { returnObjects: true }) as string[]
  }

  createEnemies(bossNpc: NPC, context: GameContext): CombatUnit[] {
    const { battle, monster } = context

    // 1. 메인 보스 추가
    const enemies: CombatUnit[] = [battle.toCombatUnit(bossNpc, 'npc')]

    // 2. 동반 몬스터가 있다면 추가
    const additional = monster.makeMonsters(this.withMonsterGroup).map((m) => battle.toCombatUnit(m, 'monster'))
    enemies.push(...additional)

    return enemies
  }

  async onVictory(player: Player, context: GameContext) {
    context.events.completeEvent('got_terminal_map')
  }
}
