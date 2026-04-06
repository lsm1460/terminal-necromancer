import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { Buff, BuffOptions } from '../Buff'
import { CombatUnit } from './CombatUnit'

export class UnitBuffManager {
  public buffs: Buff[] = []
  public deBuffs: Buff[] = []
  private buffType = ['buff', 'stealth']

  constructor(private owner: CombatUnit) {}

  public get isStealth() {
    return this.buffs.some((b) => b.type === 'stealth')
  }

  public get isConfused() {
    return this.deBuffs.some((_d) => _d.id === 'confuse')
  }

  public hasDeBuff(id: BuffOptions['id']) {
    return this.deBuffs.some((_d) => _d.id === id)
  }

  private getBuffMessage(buff: Buff) {
    const isBuff = this.buffType.includes(buff.type)
    const path = isBuff ? 'skill.message.buff' : 'skill.message.debuff'
    const fullPath = `${path}.${buff.id}`

    if (!i18n.exists(fullPath)) {
      return
    }

    return (name: string, hp?: number, maxHp?: number) =>
      i18n.t(fullPath, {
        name,
        hp: hp?.toString(),
        maxHp: maxHp?.toString(),
      })
  }

  private processEffect(effectOrOptions: BuffOptions, action: 'apply' | 'remove', force = false): void {
    const effect = new Buff(effectOrOptions)
    const isBuff = this.buffType.includes(effect.type)
    const targetArray = isBuff ? this.buffs : this.deBuffs

    if (action === 'apply') {
      const existing = targetArray.find((e) => e.id === effect.id)
      if (existing) {
        existing.duration = Math.max(existing.duration, effect.duration)
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
        Terminal.log(
          i18n.t('battle.unit.status_change.effect_removed', {
            name: this.owner.name,
            effectName: effect.name,
          })
        )
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

      Terminal.log(i18n.t('battle.unit.status_change.stealth_broken', { name: this.owner.name }))
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

    Terminal.log(
      i18n.t('battle.unit.status_change.recovered', {
        name: this.owner.name,
        effectName: removed.name,
      })
    )
  }

  public removeRandomBuff(): void {
    if (this.buffs.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.buffs.length)
    const removed = this.buffs.splice(randomIndex, 1)[0]

    Terminal.log(
      i18n.t('battle.unit.status_change.forced_removed', {
        name: this.owner.name,
        effectName: removed.name,
      })
    )
  }

  public getStatBonus(statName: 'atk' | 'def' | 'eva' | 'crit'): number {
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
        Terminal.log(
          i18n.t(messageKey, {
            unitName: this.owner.name,
            effectName: e.name,
          })
        )
      })

      const remaining = array.filter((e) => e.duration > 0)
      if (type === 'buff') this.buffs = remaining
      else this.deBuffs = remaining
    })
  }
}
