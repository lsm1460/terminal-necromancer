import { SkeletonRarity } from '~/consts'
import i18n from '~/i18n'
import { BattleTarget } from '~/types'
import { getOriginId } from '~/utils'
import { Player } from './Player'

interface SkeletonWrapper extends BattleTarget {}

class SkeletonWrapper {
  constructor(
    public raw: BattleTarget,
    private player: Player
  ) {}

  // Delegations for BattleTarget compatibility
  get id() {
    return this.raw.id
  }
  get name() {
    return SkeletonWrapper.getSkeletonName(this.raw)
  }
  static getSkeletonName(skeleton: BattleTarget) {
    const originId = getOriginId(skeleton.id)

    const rarityColors: Record<SkeletonRarity, string> = {
      common: '\x1b[37m', // 하얀색
      rare: '\x1b[32m', // 초록색
      elite: '\x1b[94m', // 파란색
      epic: '\x1b[35m', // 보라색
      legendary: '\x1b[33m', // 노란색(금색)
    }

    const resetColor = '\x1b[0m'
    const rarity = skeleton.rarity || 'common'
    const color = rarityColors[rarity]
    const rarityTag = `${color}[${rarity.toUpperCase()}]${resetColor} `

    return rarityTag + i18n.t(`npc.${originId}.name`)
  }
  get rarity() {
    return this.raw.rarity
  }
  get attackType() {
    return this.raw.attackType
  }
  get hp() {
    return this.raw.hp
  }
  set hp(v: number) {
    this.raw.hp = v
  }
  get maxHp() {
    return this.raw.maxHp
  }
  get atk() {
    return this.raw.atk
  }
  get def() {
    return this.raw.def
  }
  get agi() {
    return this.raw.agi
  }
  get exp() {
    return this.raw.exp
  }
  get description() {
    const originId = this.raw.originId ? getOriginId(this.raw.originId) : ''

    const originCorpseName = i18n.t(`npc.${originId}.name`)

    return i18n.t(`npc.skeleton.description`, { name: originCorpseName })
  }
  get dropTableId() {
    return this.raw.dropTableId
  }
  get encounterRate() {
    return this.raw.encounterRate
  }
  get isAlive() {
    return this.raw.isAlive
  }
  set isAlive(v: boolean) {
    this.raw.isAlive = v
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
  get isSkeleton() {
    return this.raw.isSkeleton
  }
  get originId() {
    return this.raw.originId
  }
  get deathLine() {
    return this.raw.deathLine
  }
  get orderWeight() {
    return this.raw.orderWeight
  }

  get class() {
    return this.raw.id.split('skeleton_')[1]
  }

  get skills(): string[] {
    // 1. 기존에 들어있을 수 있는 어픽스 관련 스킬들을 한 번에 제거
    const affixSkillIds = ['death_destruct', 'frostborne']
    let currentSkills = (this.raw.skills || []).filter((id) => !affixSkillIds.includes(id))

    if (this.player.hasAffix('DOOMSDAY')) {
      currentSkills.push('death_destruct')
    }

    if (this.player.hasAffix('FROSTBORNE')) {
      currentSkills.push('frostborne')
    }

    if (this.player.hasAffix('CLEANSE') && ['monk', 'priest'].includes(this.class)) {
      currentSkills.push('purify_essence')
    }

    return currentSkills
  }
}

export default SkeletonWrapper
