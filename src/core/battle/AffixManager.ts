import { BattleTarget } from '../../types'
import { delay } from '../../utils'
import { Player } from '../Player'
import { Battle } from './Battle'
import { CombatUnit } from './CombatUnit'

export class AffixManager {
  static setup(unit: CombatUnit, player: Player, battle: Battle) {
    // 피격 후 훅 연결
    unit.onAfterHitHooks.push(async (attacker, defender) => {
      await this.handleAfterHit(player, attacker, defender)
    })
    unit.onAfterHitHooks.push(async (attacker, defender) => {
      await this.handleAfterAttack(player, attacker, defender)
    })

    // 사망 시 훅 연결
    unit.onDeathHooks.push(async (deathUnit) => {
      await this.handleOnDeath(player, deathUnit, battle)
    })
  }

  static async handleAfterHit(player: Player, attacker: CombatUnit, defender: CombatUnit) {
    if (player.hasAffix('THORNS') && (defender.ref as BattleTarget).isGolem) {
      const thornDamage = Math.max(1, Math.floor(defender.ref.atk * 0.05))

      console.log(`\n[🦷 가시]: ${defender.name}의 가시가 ${attacker.name}의 살점을 찢습니다!`)

      await delay(500)

      if (attacker.ref.hp === 0) {
        return
      }

      await attacker.takeDamage(defender, {
        rawDamage: thornDamage,
        isIgnoreDef: false, // 시체 폭발이 방어력을 무시하게 하려면 true로 변경
        isSureHit: false, // 회피 불가능하게 하려면 true로 변경
      })

      await delay(300)
    }
  }

  static async handleOnDeath(player: Player, deathUnit: CombatUnit, battle: Battle) {
    if (player.hasAffix('DOOMSDAY') && (deathUnit.ref as BattleTarget).isSkeleton) {
      const enemies = Array.from(battle.getAliveEnemies()).filter(
        (u) => ['monster', 'npc'].includes(u.type) && u.ref.isAlive
      )

      const rawExplosionDamage = Math.floor(deathUnit.ref.maxHp * 0.6)

      console.log(`\n[🔥 종말]: ${deathUnit.name}의 시체가 폭발합니다!`)

      await delay(500)
      for (const enemy of enemies) {
        if (enemy.ref.hp === 0) {
          continue
        }

        await enemy.takeDamage(deathUnit, {
          rawDamage: rawExplosionDamage,
          isIgnoreDef: false, // 시체 폭발이 방어력을 무시하게 하려면 true로 변경
          isSureHit: false, // 회피 불가능하게 하려면 true로 변경
        })

        await delay(300)
      }
    }
  }

  static async handleAfterAttack(player: Player, attacker: CombatUnit, defender: CombatUnit) {
    // 1. FROSTBORNE (서리 서린 유해)
    if (player.hasAffix('FROSTBORNE') && (attacker.ref as BattleTarget).isSkeleton) {
      defender.applyDeBuff({
        name: '심연의 한기',
        type: 'deBuff',
        duration: 3,
        agi: 5,
      })
    }
  }

  static handleBeforeAttack(
    player: Player,
    attacker: CombatUnit,
    targets: CombatUnit<BattleTarget>[]
  ): CombatUnit {
    let target = targets[0]

    const isEnemyAttack = ['npc', 'monster'].includes(attacker.type)

    if (isEnemyAttack && player.hasAffix('ROAR')) {
      const golem = targets.find((target) => target.ref.isGolem && target.ref.isAlive)

      if (golem) {
        // 🔊 상황에 맞는 로그 출력
        console.log(
          `\n[📢 포효]: 골렘이 증기를 내뿜고 굉음을 내지릅니다!! ${attacker.name}의 시선이 골렘에게 고정됩니다.`
        )
        return golem
      }
    }

    return target
  }
}
