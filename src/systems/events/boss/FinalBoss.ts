import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { BattleTarget, GameContext, NPC } from '~/types'
import { BossLogic } from './BossLogic'
import { Terminal } from '~/core/Terminal'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'

export class FinalBoss implements BossLogic {
  selectedSide = ''

  get postTalk() {
    return i18n.t('npc.third_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: NPC, context: GameContext, player: Player) {
    const { monster, battle } = context

    const boss = monster.makeMonster('test_man')!
    const unit = battle.toCombatUnit(boss, 'monster')

    registerPhaseGimmicks(unit, context)

    return [unit]
  }

  async onVictory(player: Player, context: GameContext) {
    // TODO: ending..
  }
}

const registerPhaseGimmicks = (boss: CombatUnit, context: GameContext) => {
  const { battle } = context
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
        const minion = battle._spawnMonster(id, context)
        if (minion) {
          setup(minion, context)
        }
      })
    }
  })
}

const setupRealBoomer = (boomer: CombatUnit, context: GameContext) => {
  let timer = 3
  applyMinionProtection(boomer)

  boomer.onBeforeAttackHooks.push(async () => {
    --timer
    Terminal.log(`[위험] ${boomer.ref.name}: ${timer}턴 후 폭발!`)

    if (timer < 1) {
      const enemies = context.battle.getEnemiesOf(boomer)
      enemies.forEach((u) => u.takeDamage(boomer, { rawDamage: 99999, isSureHit: true }))
      await boomer.dead()
    }
  })
}

const setupFakeUnit = (unit: CombatUnit, context: GameContext) => {
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
