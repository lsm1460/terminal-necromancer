import { BattleTarget } from '~/types'
import { Player } from './Player'
import i18n from '~/i18n'

interface GolemWrapper extends BattleTarget {}

class GolemWrapper {
  upgradeLimit: number

  constructor(
    public raw: BattleTarget,
    public upgrade: ('machine' | 'soul')[],
    private player: Player
  ) {
    this.upgradeLimit = player.upgradeLimit
  }

  // Delegations for BattleTarget compatibility
  get id() {
    return this.raw.id
  }
  get attackType() {
    return this.raw.attackType
  }
  get agi() {
    return this.raw.agi
  }
  get exp() {
    return this.raw.exp
  }
  get description() {
    return i18n.t(`npc.golem.description.${this.raw.madeBy}`)
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
  get isGolem() {
    return this.raw.isGolem
  }
  get deathLine() {
    return this.raw.deathLine
  }
  get orderWeight() {
    return this.raw.orderWeight
  }

  private get machineCount() {
    return this.upgrade.filter((u) => u === 'machine').length
  }
  private get soulCount() {
    return this.upgrade.filter((u) => u === 'soul').length
  }
  private get hasThorns() {
    return this.player.hasAffix('THORNS')
  }

  get atk(): number {
    const bonus = this.soulCount * 20 + this.machineCount * 5
    return this.raw.atk + bonus
  }

  get def(): number {
    const bonus = this.machineCount * 20 + this.soulCount * 10
    return this.raw.def + bonus
  }

  get maxHp(): number {
    const bonusHp = this.machineCount * 40 + this.soulCount * 20
    return this.raw.maxHp + bonusHp
  }

  get name(): string {
    const m = this.machineCount
    const s = this.soulCount
    let key = 'default'

    if (s >= 3 && m >= 3) {
      key = 'soul_3_machine_3'
    } else if (s >= 3) {
      key = 'soul_3'
    } else if (m >= 3) {
      key = 'machine_3'
    } else if (s > 0 && m > 0) {
      key = 'soul_machine_mixed'
    } else if (s > 0) {
      key = 'soul_only'
    } else if (m > 0) {
      key = 'machine_only'
    }

    const baseName = i18n.t(`npc.golem.name.${key}`)

    if (this.hasThorns) {
      return i18n.t('npc.golem.prefix.thorns', { name: baseName })
    }

    return baseName
  }

  get skills(): string[] {
    // 기본 스킬 셋 결정
    let skillList = this.hasThorns ? ['thorns'] : [...(this.raw.skills || [])]

    // 업그레이드 횟수가 제한을 초과한 경우 self_destruct 추가
    if (this.upgrade.length > this.upgradeLimit) {
      skillList.push('self_destruct')
    }

    return skillList
  }

  // hp 참조는 유지 (전투 중 실시간 반영을 위해 필요)
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

export default GolemWrapper
