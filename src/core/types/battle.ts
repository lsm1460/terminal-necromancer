import { BattleTarget } from "~/types"
import { Drop } from "./item"

export type CalcDamageReturn = {
  isEscape: boolean
  damage: number
  isCritical: boolean
}

export type TakeDamageReturn = {
  currentHp: number
  isDead: boolean
} & CalcDamageReturn

export interface Monster extends BattleTarget {
  drops: Drop[]
}