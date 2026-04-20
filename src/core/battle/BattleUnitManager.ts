import _ from 'lodash'
import { CombatUnit } from './unit/CombatUnit'
import { Player } from '../player/Player'
import { BattleTarget } from '~/types'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { Terminal } from '../Terminal'
import { Battle } from './Battle'
import i18n from '~/i18n'

export class BattleUnitManager {
  private unitCache = new Map<any, CombatUnit>()

  constructor(
    private player: Player,
    private manager: Battle,
    private npcSkills: NpcSkillManager
  ) {}

  public toCombatUnit<T extends Player | BattleTarget>(unit: T, type: CombatUnit['type']): CombatUnit<T> {
    const cached = this.getUnit(unit.id)
    if (cached) return cached as CombatUnit<T>
    const combatUnit = new CombatUnit<T>(unit, type, this.manager)
    this.npcSkills.setupPassiveHook(combatUnit, this.manager)
    return combatUnit
  }

  refreshPlayerSide() {
    this.registerUnit(this.toCombatUnit(this.player, 'player'))

    if (this.player.party) {
      this.player.party.forEach((m) => {
        if (m.isAlive) {
          const mUnit = this.toCombatUnit(m, 'minion')
          const _res = this.registerUnit(mUnit)

          if (_res) {
            mUnit.onDeath = async () => {
              this.unregisterUnit(m.id)
              m.hp = 0
              m.isAlive = false
              this.player.dismissMember(m.id)
              Terminal.log(i18n.t('battle.unit_death', { name: m.name }))
            }
          }
        }
      })
    }
  }

  registerUnit(unit: CombatUnit) {
    if (this.unitCache.has(unit.id)) return false
    this.unitCache.set(unit.id, unit)

    return true
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
        return _.findIndex(this.player.party, { id: unit.id })
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
