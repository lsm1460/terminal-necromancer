import i18n from '~/i18n'
import { BattleTarget } from '~/types'
import { Terminal } from '../Terminal'
import { Player } from '../player/Player'
import { CombatUnit } from './unit/CombatUnit'

export class AffixManager {
  static handleBeforeAttack(player: Player, attacker: CombatUnit, targets: CombatUnit<BattleTarget>[]): CombatUnit[] {
    const isEnemyAttack = ['npc', 'monster'].includes(attacker.type)

    if (isEnemyAttack && player.hasAffix('ROAR')) {
      const golem = targets.find((target) => target.ref.isGolem && target.ref.isAlive)

      if (golem) {
        // 🔊 상황에 맞는 로그 출력
        Terminal.log(i18n.t('affix.ROAR.activation', { attacker: attacker.name }))
        return [golem]
      }
    }

    return targets
  }
}
