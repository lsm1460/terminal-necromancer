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
    if (options.isPassive) labels.push('\x1b[36m[패시브]\x1b[0m') // 청록
    if (options.isSureHit) labels.push('\x1b[33m[필중]\x1b[0m') // 노랑
    if (options.isSureCrit) labels.push('\x1b[31m[확정 치명]\x1b[0m') // 빨강
    if (options.isIgnoreDef) labels.push('\x1b[35m[방어 관통]\x1b[0m') // 자색
    if (options.isFixed) labels.push('\x1b[32m[고정 피해]\x1b[0m') // 녹색

    const labelPrefix = labels.length > 0 ? `${labels.join(' ')} ` : ''
    const hpStatus = `\x1b[90m(${defenderName}의 남은 HP: ${currentHp})\x1b[0m`

    if (isEscape) {
      return `${labelPrefix}\x1b[37m${attackerName}\x1b[0m의 공격! 💨 \x1b[37m${defenderName}\x1b[0m이(가) 회피했습니다. ${hpStatus}`
    }

    if (damage <= 0) {
      return `${labelPrefix}\x1b[37m${attackerName}\x1b[0m의 공격! 🛡️ 하지만 \x1b[37m${defenderName}\x1b[0m에게 피해를 주지 못했습니다. ${hpStatus}`
    }

    const damageMsg = isCritical ? `\x1b[1m\x1b[31m⚡ CRITICAL! ${damage}\x1b[0m` : `\x1b[31m${damage}\x1b[0m`

    return `${labelPrefix}\x1b[37m${attackerName}\x1b[0m의 공격! \x1b[37m${defenderName}\x1b[0m에게 ${damageMsg}의 피해! ${hpStatus}`
  }
}
