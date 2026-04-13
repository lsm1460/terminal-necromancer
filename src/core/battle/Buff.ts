import i18n from '~/i18n'

export type BuffType = 'deBuff' | 'bind' | 'buff' | 'dot' | 'focus' | 'stealth' | 'expose' | 'confuse'

export interface BuffOptions {
  id:
    | 'burn'
    | 'freeze'
    | 'stun'
    | 'paralysis'
    | 'bind'
    | 'bleed'
    | 'expose'
    | 'bone_prison'
    | 'overdrive'
    | 'aging'
    | 'injury'
    | 'curse'
    | 'smoke'
    | 'poison'
    | 'defense'
    | 'stealth'
    | 'focus'
    | 'confuse'
    | 'soul_chain'
    | 'death_stigma'
    | 'grace'
  duration: number
  type: BuffType
  atk?: number
  agi?: number
  dot?: number
  def?: number
  eva?: number
  hp?: number
  crit?: number
  isLocked?: boolean
}

export class Buff {
  id: BuffOptions['id']
  duration: number
  type: BuffType
  stack = 0

  atk?: number
  agi?: number
  def?: number
  eva?: number
  hp?: number
  dot?: number
  crit?: number
  isLocked?: boolean

  constructor(options: BuffOptions) {
    this.id = options.id || 'unknown'
    this.duration = options.duration
    this.type = options.type
    this.atk = options.atk
    this.agi = options.agi
    this.def = options.def
    this.eva = options.eva
    this.hp = options.hp
    this.dot = options.dot
    this.crit = options.crit
    this.isLocked = options.isLocked
  }

  get name(): string {
    return i18n.t(`battle.buff.${this.id}`)
  }
}
