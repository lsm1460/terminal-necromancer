import { AttackType } from '../types'
import { CombatUnit } from './unit/CombatUnit'

export type DamageOptions = {
  skillAtkMult?: number // 데미지 배율
  rawDamage?: number // 직접 계산된 데미지 (시체 폭발 등)
  isIgnoreDef?: boolean // 방어력 무시
  isFixed?: boolean // 고정 데미지
  isSureHit?: boolean // 회피불가
  isSureCrit?: boolean // 무조건 치명타
  attackType?: AttackType
  isPassive?: boolean
}

export class CombatService {
  static calcDamage(attacker: CombatUnit, target: CombatUnit, options: DamageOptions = {}) {
    const { atk, crit } = attacker.finalStats
    const { def, eva } = target.finalStats

    // 1. 회피 판정
    if (!options.isSureHit && Math.random() < eva) {
      return { isEscape: true, damage: 0, isCritical: false }
    }

    // 2. 기초 데미지 결정 (rawDamage가 없으면 계산된 atk 사용)
    const baseAtk = (options.rawDamage ?? atk) * (options.skillAtkMult ?? 1)

    // 3. 크리티컬 판정
    const isCrit = options.isSureCrit || Math.random() < crit
    let finalDamage = isCrit ? baseAtk * 1.2 : baseAtk

    // 4. 방어력 적용
    if (!options.isFixed) {
      const appliedDef = options.isIgnoreDef ? 0 : def
      finalDamage = Math.max(1, finalDamage - Math.floor(appliedDef / 2))
    }

    return { isEscape: false, damage: Math.floor(finalDamage), isCritical: isCrit }
  }
}
