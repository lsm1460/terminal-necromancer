import { TranslationInfo } from '~/core/types'
import { DamageOptions } from '../Battle'

export class BattleLogFormatter {
  public static formatDamageLog(
    attackerName: string,
    defenderName: string,
    currentHp: number,
    result: { isEscape: boolean; damage: number; isCritical: boolean },
    options: DamageOptions = {}
  ): TranslationInfo {
    const { isEscape, damage, isCritical } = result

    const labelKeys: string[] = []
    if (options.isPassive) labelKeys.push('battle.unit.labels.passive')
    if (options.isSureHit) labelKeys.push('battle.unit.labels.sure_hit')
    if (options.isSureCrit) labelKeys.push('battle.unit.labels.sure_crit')
    if (options.isIgnoreDef) labelKeys.push('battle.unit.labels.ignore_def')
    if (options.isFixed) labelKeys.push('battle.unit.labels.fixed')

    const tArgs = {
      attacker: attackerName,
      defender: defenderName,
      hp: currentHp,
      labelPrefix: labelKeys.map((key) => ({ key })),
    }

    if (isEscape) {
      return { key: 'battle.unit.log.evaded', args: tArgs }
    }

    if (damage <= 0) {
      return { key: 'battle.unit.log.no_damage', args: tArgs }
    }

    const damageMsg = isCritical ? `\x1b[1m\x1b[31m⚡ CRITICAL! ${damage}\x1b[0m` : `\x1b[31m${damage}\x1b[0m`

    return {
      key: 'battle.unit.log.hit',
      args: { ...tArgs, damageMsg },
    }
  }
}
