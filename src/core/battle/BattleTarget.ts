import { AttackType } from "../types"

export abstract class BattleTarget {
  id!: string
  abstract name: string
  attackType!: AttackType
  baseMaxHp?: number
  maxHp!: number
  hp!: number
  baseAtk?: number
  atk!: number
  baseDef?: number
  def!: number
  agi!: number
  exp!: number
  eva!: number
  crit?: number
  abstract description: string
  encounterRate!: number // ← 개별 몬스터 출현 확률 (%)
  isAlive!: boolean
  dropTableId?: string
  skills?: string[]
  preemptive?: boolean
  noEscape?: boolean
  noCorpse?: boolean
  orderWeight?: number

  constructor(base: any) {
    Object.assign(this, base)
  }

  getCorpse?() {
    return {
      maxHp: this.maxHp,
      atk: this.atk,
      def: this.def,
      agi: this.agi,
      name: this.name,
      id: this.id,
    }
  }
}