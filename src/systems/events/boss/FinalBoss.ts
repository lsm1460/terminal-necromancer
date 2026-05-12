import { Terminal } from '~/core'
import { Battle } from '~/core/battle'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { BaseNPC } from '~/core/npc/BaseNPC'
import i18n from '~/i18n'
import { Ending, Necromancer } from '~/systems'
import { AppContext } from '~/systems/types'
import { IMinion } from '~/types'
import { BossLogic } from './BossLogic'
import { speak } from '~/utils'

export class FinalBoss implements BossLogic {
  get postTalk() {
    return i18n.t('npc.final_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: BaseNPC, context: AppContext) {
    const { monster, battle, events, player, npcs } = context

    if (events.isCompleted('join_resistance_battle')) {
      await speak(i18n.t('npc.final_boss.resistance', { returnObjects: true }) as string[])

      const god = monster.makeMonster('fallen_god_3')

      player.addMercenary(god!)
    }

    const isCaronActiveAlly = events.isCompleted('caron_is_mine') && !events.isCompleted('caron_is_dead');

    if (!player.hasMercenary('caron') && isCaronActiveAlly) {
      await speak(i18n.t('npc.final_boss.caron', { returnObjects: true }) as string[])

      const caron = npcs.getNPC('caron')

      player.addMercenary(caron!)
    }

    const boss = monster.makeMonster('death_origin')!
    const unit = battle.toCombatUnit(boss, 'monster')

    unit.onProcessHitHooks.push(async (attacker, defender, options) => {
      if ((attacker.ref as IMinion).isMinion) {
        options.rawDamage = 0 // 대미지 무효화

        Terminal.log(i18n.t('npc.final_boss.immunity'))
      }

      if ((attacker.ref as Necromancer).id === 'player') {
        options.rawDamage = 1
      }
    })

    registerPhaseGimmicks(unit, battle)

    return [unit]
  }

  async onVictory(bossNpc: BaseNPC, context: AppContext) {
    await Ending.run(context)

    return 'exit' as const
  }
}

const registerPhaseGimmicks = (boss: CombatUnit, battle: Battle) => {
  const thresholds = [0.7, 0.4]

  boss.onAfterHitHooks.push(async (attacker, defender) => {
    const hpRatio = defender.ref.hp / defender.ref.maxHp

    if (thresholds.length > 0 && hpRatio < thresholds[0]) {
      thresholds.shift()

      Terminal.log(i18n.t('npc.final_boss.circle_of_death.cast'))

      // 1. 소환할 명단 정의 (몬스터ID, 셋업함수)
      const spawnList = [
        { id: 'token_true_verdict', setup: setupRealBoomer },
        { id: 'token_false_verdict', setup: setupFakeUnit },
        { id: 'token_false_verdict', setup: setupFakeUnit },
      ]

      // 2. 반복문을 통한 일괄 소환 및 설정
      spawnList
        .sort(() => Math.random() - 0.5)
        .forEach(({ id, setup }) => {
          const minion = battle._spawnMonster(id)
          if (minion) {
            setup(minion, battle)
          }
        })
    }
  })
}

const setupRealBoomer = (boomer: CombatUnit, battle: Battle) => {
  let timer = 3
  applyMinionProtection(boomer)

  boomer.onBeforeAttackHooks.push(async () => {
    --timer

    if (timer < 1) {
      Terminal.log(i18n.t('npc.final_boss.circle_of_death.fail'))

      const enemies = battle.getEnemiesOf(boomer)
      enemies.forEach((u) => u.takeDamage(boomer, { rawDamage: 99999, isSureHit: true }))
      await boomer.dead()
    } else {
      Terminal.log(
        i18n.t('npc.final_boss.circle_of_death.countdown', {
          timer: timer,
        })
      )
    }
  })
}

const setupFakeUnit = (unit: CombatUnit) => {
  let timer = 3
  applyMinionProtection(unit)

  unit.onBeforeAttackHooks.push(async () => {
    --timer
    if (timer < 1) {
      Terminal.log(i18n.t('npc.final_boss.circle_of_death.fake'))
      await unit.dead()
    }
  })
}

const applyMinionProtection = (unit: CombatUnit) => {
  unit.onProcessHitHooks.push(async (attacker, defender, options) => {
    const isExplode = options.attackType === 'explode'
    const isMinion = (attacker.ref as IMinion)?.isMinion

    if (isExplode || isMinion) {
      options.rawDamage = 0
      Terminal.log(i18n.t('npc.final_boss.circle_of_death.immunity'))
    }
  })
}
