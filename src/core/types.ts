export type AttackType = 'melee' | 'ranged' | 'explode'

export type CalcDamageReturn = {
  isEscape: boolean
  damage: number
  isCritical: boolean
}

export type TakeDamageReturn = {
  currentHp: number
  isDead: boolean
} & CalcDamageReturn
