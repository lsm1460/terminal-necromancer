import { Player } from './Player'

type StatOptions = {
  ignoreBloodAffix?: boolean
}

export class StatsCalculator {
  static getMaxHp(player: Player): number {
    let maxHp = player._maxHp

    maxHp += player.equipped.weapon?.hp || 0
    maxHp += player.equipped.armor?.hp || 0

    if (player.hasAffix('BLOOD')) {
      const potentialMp = StatsCalculator.getMaxMp(player, { ignoreBloodAffix: true })

      maxHp = Math.floor((maxHp + potentialMp) * 1.3)
    }

    return maxHp
  }

  static getMaxMp(player: Player, options: StatOptions = {}): number {
    const { ignoreBloodAffix = false } = options

    if (!ignoreBloodAffix && player.hasAffix('BLOOD')) {
      return 0
    }

    let maxMp = player._maxMp

    maxMp += player.equipped.weapon?.mp || 0
    maxMp += player.equipped.armor?.mp || 0

    return maxMp
  }

  static getComputed(player: Player) {
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

    if (player.hasAffix('ALONE') && player.skeleton.length < 1) {
      atk += player.maxSkeleton * 10
      def += Math.floor(player.maxSkeleton * 0.5)
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
