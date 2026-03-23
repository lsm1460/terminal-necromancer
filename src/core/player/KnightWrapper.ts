import { AttackType, BattleTarget } from '~/types'
import { Player } from './Player'
import i18n from '~/i18n'
import { getOriginId } from '~/utils'

/**
 * 1. 인터페이스 병합 (Declaration Merging)
 * 클래스와 인터페이스의 이름을 같게 선언하여,
 * 클래스가 BattleTarget의 모든 속성을 가지고 있음을 TypeScript에 알립니다.
 */
interface KnightWrapper extends BattleTarget {}

class KnightWrapper {
  constructor(
    public raw: BattleTarget,
    private player: Player
  ) {}

  // Delegations for BattleTarget compatibility
  get id() {
    return this.raw.id
  }
  get agi() {
    return this.raw.agi
  }
  get exp() {
    return this.raw.exp
  }
  get description() {
    const origin = i18n.t(`npc.${getOriginId(this.raw.originId || '')}.name`)

    return i18n.t('npc.knight.description', { origin })
  }
  get dropTableId() {
    return this.raw.dropTableId
  }
  get encounterRate() {
    return this.raw.encounterRate
  }
  get preemptive() {
    return this.raw.preemptive
  }
  get noEscape() {
    return this.raw.noEscape
  }
  get noCorpse() {
    return this.raw.noCorpse
  }
  get isNpc() {
    return this.raw.isNpc
  }
  get isMinion() {
    return this.raw.isMinion
  }
  get isKnight() {
    return this.raw.isKnight
  }
  get deathLine() {
    return this.raw.deathLine
  }
  get orderWeight() {
    return this.raw.orderWeight
  }

  private get isLich() {
    return this.player.hasAffix('TABOO')
  }
  private get hasHorse() {
    return this.player.hasAffix('WARHORSE')
  }

  get name() {
    let key = ''

    if (this.isLich) {
      key = this.hasHorse ? 'lich_mounted' : 'lich_unmounted'
    } else {
      key = this.hasHorse ? 'knight_mounted' : 'knight_unmounted'
    }

    return i18n.t(`npc.knight.name.${key}`)
  }

  get atk() {
    const base = this.raw.baseAtk || this.raw.atk
    return this.isLich ? Math.floor(base * 0.6) : base
  }

  get def() {
    const base = this.raw.baseDef || this.raw.def
    return this.isLich ? Math.floor(base * 0.6) : base
  }

  get maxHp() {
    const base = this.raw.baseMaxHp || this.raw.maxHp

    return this.hasHorse ? Math.floor(base * 1.2) : base
  }

  get skills(): string[] {
    const state = `${this.isLich ? 'LICH' : 'KNIGHT'}_${this.hasHorse ? 'HORSE' : 'FOOT'}`

    const skillTable: Record<string, string[]> = {
      LICH_HORSE: ['abyssal_gallop', 'bone_prison', 'aging_curse'], // 망령의 군주
      LICH_FOOT: ['bone_prison', 'aging_curse'], // 타락한 리치
      KNIGHT_HORSE: ['dread_charge', 'power_smash'], // 심연의 기사
      KNIGHT_FOOT: this.raw.skills || [], // 기본 기사 (원본 참조)
    }

    // 3. 해당하는 상태의 스킬셋을 반환 (없을 경우를 대비해 원본 스킬을 백업으로)
    return skillTable[state] || this.raw.skills!
  }

  get attackType(): AttackType {
    return this.isLich ? 'ranged' : 'melee'
  }

  get hp() {
    return this.raw.hp
  }
  set hp(v: number) {
    this.raw.hp = v
  }

  get isAlive() {
    return this.raw.isAlive
  }

  set isAlive(v: boolean) {
    this.raw.isAlive = v
  }
}

export default KnightWrapper
