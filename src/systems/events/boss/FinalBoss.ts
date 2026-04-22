import { Ending } from '~/core/Ending'
import { Terminal } from '~/core/Terminal'
import { Battle } from '~/core/battle'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { BattleTarget, NPC } from '~/types'
import { BossLogic } from './BossLogic'

export class FinalBoss implements BossLogic {
  get postTalk() {
    return i18n.t('npc.third_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: NPC, context: GameContext) {
    const { monster, battle } = context

    const boss = monster.makeMonster('test_man')!
    const unit = battle.toCombatUnit(boss, 'monster')

    registerPhaseGimmicks(unit, battle)

    return [unit]
  }

  async onVictory(bossNpc: NPC, context: GameContext<Necromancer>) {
    await Ending.run(context)

    const _res = await Terminal.confirm('타이틀로 돌아가시겠습니까?')

    if (_res) {

    }
  }
}

const registerPhaseGimmicks = (boss: CombatUnit, battle: Battle) => {
  const thresholds = [0.7, 0.4]

  boss.onAfterHitHooks.push(async (attacker, defender) => {
    const hpRatio = defender.ref.hp / defender.ref.maxHp

    if (thresholds.length > 0 && hpRatio < thresholds[0]) {
      thresholds.shift()

      Terminal.log('보스가 지원군을 호출합니다!')

      // 1. 소환할 명단 정의 (몬스터ID, 셋업함수)
      const spawnList = [
        { id: 'track_ratman', setup: setupRealBoomer },
        { id: 'snare_spider', setup: setupFakeUnit },
        { id: 'snare_spider', setup: setupFakeUnit },
      ]

      // 2. 반복문을 통한 일괄 소환 및 설정
      spawnList.forEach(({ id, setup }) => {
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
    Terminal.log(`[위험] ${boomer.ref.name}: ${timer}턴 후 폭발!`)

    if (timer < 1) {
      const enemies = battle.getEnemiesOf(boomer)
      enemies.forEach((u) => u.takeDamage(boomer, { rawDamage: 99999, isSureHit: true }))
      await boomer.dead()
    }
  })
}

const setupFakeUnit = (unit: CombatUnit) => {
  let timer = 3
  applyMinionProtection(unit)

  unit.onBeforeAttackHooks.push(async () => {
    --timer
    if (timer < 1) {
      Terminal.log(`${unit.ref.name}이(가) 연기처럼 사라집니다.`)
      await unit.dead()
    }
  })
}

const applyMinionProtection = (unit: CombatUnit) => {
  unit.onProcessHitHooks.push(async (attacker, defender, options) => {
    if ((attacker.ref as BattleTarget).isMinion) {
      options.rawDamage = 0
      Terminal.log(`${unit.ref.name}은(는) 미니언의 공격을 받지 않습니다.`)
    }
  })
}
