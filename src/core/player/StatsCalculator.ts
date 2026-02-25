import { ArmorItem, WeaponItem } from '~/types'

export interface StatsProvider {
  _maxHp: number
  _maxMp: number
  atk: number
  def: number
  agi: number
  eva: number
  crit: number
  equipped: {
    weapon: WeaponItem | null
    armor: ArmorItem | null
  }
}

export class StatsCalculator {
  static getMaxHp(player: StatsProvider): number {
    let maxHp = player._maxHp

    if (player.equipped.weapon) maxHp += player.equipped.weapon?.hp || 0
    if (player.equipped.armor) maxHp += player.equipped.armor?.hp || 0

    return maxHp
  }

  static getMaxMp(player: StatsProvider): number {
    let maxMp = player._maxMp

    if (player.equipped.weapon) maxMp += player.equipped.weapon?.mp || 0
    if (player.equipped.armor) maxMp += player.equipped.armor?.mp || 0

    return maxMp
  }

  static getComputed(player: StatsProvider) {
    let atk = player.atk
    let crit = player.crit
    let def = player.def
    let eva = player.eva
    let attackType = 'melee'

    if (player.equipped.weapon) {
      atk += player.equipped.weapon.atk
      attackType = player.equipped.weapon.attackType || 'melee'
      crit += player.equipped.weapon.crit
    }
    
    if (player.equipped.armor) {
      def += player.equipped.armor.def
      eva += player.equipped.armor?.eva || 0
    }

    return {
      maxHp: this.getMaxHp(player),
      maxMp: this.getMaxMp(player),
      atk,
      crit,
      def,
      eva,
      attackType,
    }
  }
}
