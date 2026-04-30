import { Terminal } from '~/core'
import { Buff, BuffOptions } from '../Buff'
import { CombatUnit } from './CombatUnit'

export type BuffFilterCondition = { id?: BuffOptions['id']; type?: BuffOptions['type'] }

export class UnitBuffManager {
  public buffs: Buff[] = []
  public deBuffs: Buff[] = []
  private buffType = ['buff', 'stealth']

  constructor(private owner: CombatUnit) {}

  public get isStealth() {
    return this.buffs.some((b) => b.type === 'stealth')
  }

  public get isConfused() {
    return this.deBuffs.some((_d) => _d.type === 'confuse')
  }

  private _hasEffect(effects: BuffOptions[], condition: BuffFilterCondition) {
    const { id, type } = condition
    return effects.some((effect) => {
      const matchId = id ? effect.id === id : true
      const matchType = type ? effect.type === type : true
      return matchId && matchType
    })
  }

  public hasBuff(condition: BuffFilterCondition) {
    return this._hasEffect(this.buffs, condition)
  }

  public hasDeBuff(condition: BuffFilterCondition) {
    return this._hasEffect(this.deBuffs, condition)
  }

  public hasEffect(condition: BuffFilterCondition) {
    return this.hasBuff(condition) || this.hasDeBuff(condition)
  }

  private getBuffMessage(buff: Buff) {
    const isBuff = this.buffType.includes(buff.type)
    const path = isBuff ? 'skill.message.buff' : 'skill.message.debuff'
    const fullPath = `${path}.${buff.id}`

    return (name: string, hp?: number, maxHp?: number) => ({
      key: fullPath,
      args: {
        name,
        ...(hp !== undefined && { hp: hp.toString() }),
        ...(maxHp !== undefined && { maxHp: maxHp.toString() }),
      },
      optional: true,
    })
  }

  private processEffect(effectOrOptions: BuffOptions, action: 'apply' | 'remove', force = false): void {
    const effect = new Buff(effectOrOptions)
    const isBuff = this.buffType.includes(effect.type)
    const targetArray = isBuff ? this.buffs : this.deBuffs

    if (action === 'apply') {
      if (this.owner.hasImmunity(effect)) {
        Terminal.log({
          key: 'battle.unit.status_change.resisted',
          args: {
            name: this.owner.name,
            effectName: effect.name,
          },
        })

        return
      }

      const existing = targetArray.find((e) => e.id === effect.id)
      if (existing) {
        existing.duration = effect.duration
        existing.atk = effect.atk
        existing.def = effect.def
        existing.agi = effect.agi
        existing.eva = effect.eva
        existing.hp = effect.hp
        existing.crit = effect.crit
        existing.stack++
      } else {
        targetArray.push(effect)
      }

      const getMsg = this.getBuffMessage(effect)
      if (getMsg) {
        Terminal.log(getMsg(this.owner.name, this.owner.ref.hp, this.owner.ref.maxHp))
      }
    } else {
      const initialLength = targetArray.length
      const newArray = targetArray.filter((b) => {
        if (b.id !== effect.id) return true
        if (b.isLocked && !force) return true
        return false
      })

      if (isBuff) this.buffs = newArray
      else this.deBuffs = newArray

      if (newArray.length < initialLength) {
        Terminal.log({
          key: 'battle.unit.status_change.effect_removed',
          args: {
            name: this.owner.name,
            effectName: effect.name,
          },
        })
      }
    }
  }

  public applyBuff(b: BuffOptions) {
    this.processEffect(b, 'apply')
  }

  public applyDeBuff(d: BuffOptions) {
    this.processEffect(d, 'apply')
  }

  public removeBuff(id: BuffOptions['id'], force = false): void {
    this.processEffect({ id, type: 'buff' } as BuffOptions, 'remove', force)
  }

  public removeDeBuff(id: BuffOptions['id'], force = false): void {
    this.processEffect({ id, type: 'deBuff' } as BuffOptions, 'remove', force)
  }

  public removeStealth(): void {
    const canReveal = this.buffs.some((b) => b.type === 'stealth' && !b.isLocked)

    if (canReveal) {
      this.buffs = this.buffs.filter((b) => b.type !== 'stealth' || b.isLocked)

      Terminal.log({
        key: 'battle.unit.status_change.stealth_broken',
        args: { name: this.owner.name },
      })

      this.applyDeBuff({
        id: 'expose',
        duration: 2,
        type: 'expose',
      })
    }
  }

  public removeRandomDeBuff(): void {
    if (this.deBuffs.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.deBuffs.length)
    const removed = this.deBuffs.splice(randomIndex, 1)[0]

    Terminal.log({
      key: 'battle.unit.status_change.recovered',
      args: {
        name: this.owner.name,
        effectName: removed.name,
      },
    })
  }

  public removeRandomBuff(): void {
    if (this.buffs.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.buffs.length)
    const removed = this.buffs.splice(randomIndex, 1)[0]

    Terminal.log({
      key: 'battle.unit.status_change.forced_removed',
      args: {
        name: this.owner.name,
        effectName: removed.name,
      },
    })
  }

  public getStatBonus(statName: 'atk' | 'def' | 'eva' | 'agi' | 'crit'): number {
    const getSum = (arr: Buff[], key: keyof Buff) => arr.reduce((acc, b) => acc + (Number(b[key]) || 0), 0)
    return getSum(this.buffs, statName) - getSum(this.deBuffs, statName)
  }

  public updateDuration(): void {
    const effectArrays = [
      { type: 'buff' as const, array: this.buffs },
      { type: 'deBuff' as const, array: this.deBuffs },
    ]

    effectArrays.forEach(({ type, array }) => {
      const messageKey = type === 'buff' ? 'battle.effect_expired.buff' : 'battle.effect_expired.debuff'

      const expired = array.filter((e) => {
        e.duration--
        return e.duration <= 0
      })

      expired.forEach((e) => {
        Terminal.log({
          key: messageKey,
          args: {
            unitName: this.owner.name,
            effectName: e.name,
          },
        })
      })

      const remaining = array.filter((e) => e.duration > 0)
      if (type === 'buff') this.buffs = remaining
      else this.deBuffs = remaining
    })
  }
}
