import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { BossLogic } from './BossLogic'

export class SecondBoss implements BossLogic {
  withMonsterGroup = 'monster-group-b3-boss'

  get postTalk() {
    return i18n.t('npc.second_boss.postTalk', { returnObjects: true }) as string[]
  }

  get defeatTalk() {
    return i18n.t('npc.second_boss.defeatTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: BaseNPC, context: AppContext) {
    const { battle, monster } = context

    // 1. 메인 보스 추가
    const core = monster.makeMonster('golem_core')
    const coreUnit = battle.toCombatUnit(core!, 'monster')
    coreUnit.applyBuff({
      id: 'stealth',
      type: 'stealth',
      duration: Infinity,
      isLocked: true,
    })

    const enemies: CombatUnit[] = [coreUnit]

    const additional = monster.makeMonsters(this.withMonsterGroup).map((m) => battle.toCombatUnit(m, 'monster'))
    enemies.push(...additional)

    const amor = monster.makeMonster('golem_chest_armor')
    const amorUnit = battle.toCombatUnit(amor!, 'monster')

    amorUnit.onProcessHitHooks.push(async (attacker, defender, options) => {
      if (options.attackType !== 'explode') {
        options.rawDamage = 1 // 대미지를 1로 고정

        Terminal.log(i18n.t('npc.second_boss.battle.armor_deflected'))
      } else {
        options.skillAtkMult = 2
      }
    })

    amorUnit.onDeathHooks.push(async () => {
      coreUnit.removeBuff('stealth', true)

      const coreExposedLogs = i18n.t('npc.second_boss.battle.core_exposed', { returnObjects: true }) as string[]
      coreExposedLogs.forEach((_log) => Terminal.log(_log))
    })

    enemies.push(amorUnit)

    return enemies
  }

  async onVictory(bossNpc: BaseNPC, context: AppContext) {
    const { npcs } = context

    const boss = npcs.getNPC('second_boss')

    boss && boss.dead({ karma: 0 })

    Terminal.log(i18n.t('events.boss.victory.log', { name: bossNpc.name }))
  }
}
