import i18n from '~/i18n'
import { DamageOptions } from '../Battle'

export class BattleLogFormatter {
  public static formatDamageLog(
    attackerName: string,
    defenderName: string,
    currentHp: number,
    result: { isEscape: boolean; damage: number; isCritical: boolean },
    options: DamageOptions = {}
  ): string {
    const { isEscape, damage, isCritical } = result

    // --- 라벨 빌더 ---
    const labels: string[] = []
    if (options.isPassive) labels.push(i18n.t('battle.unit.labels.passive'))
    if (options.isSureHit) labels.push(i18n.t('battle.unit.labels.sure_hit'))
    if (options.isSureCrit) labels.push(i18n.t('battle.unit.labels.sure_crit'))
    if (options.isIgnoreDef) labels.push(i18n.t('battle.unit.labels.ignore_def'))
    if (options.isFixed) labels.push(i18n.t('battle.unit.labels.fixed'))

    const labelPrefix = labels.length > 0 ? `${labels.join(' ')} ` : ''
    const hpStatus = i18n.t('battle.unit.log.hp_status', { name: defenderName, hp: currentHp })

    // 공통 변수 객체
    const tArgs = { labelPrefix, attacker: attackerName, defender: defenderName, hpStatus }

    if (isEscape) {
      return i18n.t('battle.unit.log.evaded', tArgs)
    }

    if (damage <= 0) {
      return i18n.t('battle.unit.log.no_damage', tArgs)
    }

    const damageMsg = isCritical ? `\x1b[1m\x1b[31m⚡ CRITICAL! ${damage}\x1b[0m` : `\x1b[31m${damage}\x1b[0m`

    return i18n.t('battle.unit.log.hit', { ...tArgs, damageMsg })
  }
}
