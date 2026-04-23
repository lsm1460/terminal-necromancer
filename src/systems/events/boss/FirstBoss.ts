import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { Terminal } from '~/core'
import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { BossLogic } from './BossLogic'

export class FirstBoss implements BossLogic {
  withMonsterGroup = 'monster-group-b2-boss'

  get postTalk() {
    return i18n.t('npc.first_boss.postTalk', { returnObjects: true }) as string[]
  }

  get defeatTalk() {
    return i18n.t('npc.first_boss.defeatTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: BaseNPC, context: AppContext) {
    const { battle, monster } = context

    // 1. 메인 보스 추가
    const enemies: CombatUnit[] = [battle.toCombatUnit(bossNpc, 'npc')]

    // 2. 동반 몬스터가 있다면 추가
    const additional = monster.makeMonsters(this.withMonsterGroup).map((m) => battle.toCombatUnit(m, 'monster'))
    enemies.push(...additional)

    return enemies
  }

  async onVictory(bossNpc: BaseNPC, context: AppContext) {
    context.events.completeEvent('got_terminal_map')

    Terminal.log(i18n.t('events.boss.victory.log', { name: bossNpc.name }))
  }
}
