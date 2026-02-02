import { BattleTarget } from '../../types'
import { Player } from '../Player'
import { CombatUnit } from './CombatUnit'

export class AffixManager {

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
