import _ from 'lodash'
import { CombatUnit } from './unit/CombatUnit'
import { Player } from '../player/Player'
import { BattleTarget } from '~/types'

export class BattleUnitManager {
  private unitCache = new Map<any, CombatUnit>()

  constructor(private player: Player) {}

  registerUnit(unit: CombatUnit) {
    if (this.unitCache.has(unit.id)) return
    this.unitCache.set(unit.id, unit)
  }

  unregisterUnit(target: any) {
    this.unitCache.delete(target)
  }

  getUnit(id: any): CombatUnit | undefined {
    return this.unitCache.get(id)
  }

  clear() {
    this.unitCache.clear()
  }

  getAliveUnits(): CombatUnit[] {
    return Array.from(this.unitCache.values()).filter((unit) => unit.ref.isAlive)
  }

  getAliveEnemies() {
    return Array.from(this.unitCache.values())
      .filter((unit) => ['monster', 'npc'].includes(unit.type) && unit.ref.isAlive)
      .sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0)) as CombatUnit<BattleTarget>[]
  }

  getPlayerSide() {
    return _.chain(Array.from(this.unitCache.values()))
      .filter((unit) => (unit.type === 'minion' || unit.type === 'player') && unit.ref.isAlive)
      .sortBy((unit) => {
        if (unit.type === 'player') return Infinity
        return _.findIndex(this.player.minions, { id: unit.id })
      })
      .value() as CombatUnit<BattleTarget>[]
  }

  getEnemiesOf(attacker: CombatUnit): CombatUnit[] {
    return attacker.isPlayerSide ? this.getAliveEnemies() : this.getPlayerSide()
  }

  getAllysOf(attacker: CombatUnit): CombatUnit[] {
    if (attacker.isPlayerSide) {
      return this.getPlayerSide()
    } else {
      const attackerFaction = (attacker.ref as any).faction
      return this.getAliveEnemies().filter((u) => (u.ref as any).faction === attackerFaction)
    }
  }
}
