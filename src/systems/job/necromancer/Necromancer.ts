import { INIT_MAX_MEMORIZE_COUNT } from '~/consts'
import { EventBus } from '~/core/EventBus'
import { IGameItemFactory } from '~/core/item/types'
import { Player, PlayerSaveData } from '~/core/player/Player'
import { StatsCalculator } from '~/core/player/StatsCalculator'
import { GameEventType } from '~/core/types'
import i18n from '~/i18n'
import { GameEquipAble } from '~/systems/item/GameEquipAble'
import { getPlayerSkills } from '~/systems/skill/player'
import { BattleTarget, SKILL_IDS, SkillId } from '~/types'
import { Affix, AffixId } from '~/types/item'
import { MinionManager } from './MinionManager'
import { necromancerModifiers } from './Modifiers'
import SkeletonWrapper from './SkeletonWrapper'
import { GameWeapon } from '~/systems/item/GameWeapon'
import { GameAmor } from '~/systems/item/GameAmor'

export interface NecromancerSaveData extends PlayerSaveData {
  karma: number
  memorize: SkillId[]
  unlockedSkills: SkillId[]
  skeletonSubspace: BattleTarget[]
  subspaceLimit: number
  skeleton: any
  _maxSkeleton: number
  upgradeLimit: number
  golemUpgrade: any
  knightUpgrade: any
  _skeleton?: BattleTarget[]
  _mercenary?: BattleTarget[]
  _golem?: BattleTarget
  _knight?: BattleTarget
}

export class Necromancer extends Player {
  minionManager: MinionManager

  karma = 0
  _maxMemorize = INIT_MAX_MEMORIZE_COUNT
  memorize: SkillId[] = [SKILL_IDS.RAISE_SKELETON]

  public unlockedSkills: SkillId[] = [SKILL_IDS.RAISE_SKELETON]

  constructor(itemFactory: IGameItemFactory, levelData: any, eventBus: EventBus, saved?: NecromancerSaveData) {
    const {
      skeletonSubspace,
      subspaceLimit,
      skeleton,
      _maxSkeleton,
      upgradeLimit,
      golemUpgrade,
      knightUpgrade,
      modifiers,
      ...rest
    } = saved || {}

    super(itemFactory, levelData, rest)

    this.karma = saved?.karma || 0
    this.memorize = saved?.memorize || []
    this.unlockedSkills = saved?.unlockedSkills || []

    this.minionManager = new MinionManager(this, saved)
    this.initModifiers()

    eventBus.subscribe(GameEventType.NPC_IS_DEAD, ({ karma = 1 }) => (this.karma += karma))
  }

  get raw() {
    const { minionManager, modifiers, ...baseRawRest } = super.raw as any
    const minionData = this.minionManager.toJSON()

    return {
      ...baseRawRest,
      ...minionData,
    }
  }

  get maxHp() {
    return StatsCalculator.getMaxHp(this as any)
  }

  get maxMp() {
    return StatsCalculator.getMaxMp(this as any)
  }

  get computed() {
    return {
      ...(this as any),
      ...StatsCalculator.getComputed(this as any),
    }
  }

  get description() {
    if (this.karma <= 0) {
      return i18n.t('player.description.karma_0')
    }
    if (this.karma <= 5) {
      return i18n.t('player.description.karma_5')
    }
    if (this.karma <= 10) {
      return i18n.t('player.description.karma_10')
    }
    return i18n.t('player.description.karma_max')
  }

  get affixes(): Affix[] {
    return ([this.equipped.weapon, this.equipped.armor] as GameEquipAble[])
      .filter((item) => !!item && !!item.affix)
      .flatMap((item) => item.affix!)
  }

  get minRebornRarity() {
    let minRebornRarity = this.getAffixValue('ELITE_SQUAD')

    if (this.equipped.weapon) minRebornRarity += (this.equipped.weapon as GameWeapon)?.minRebornRarity || 0
    if (this.equipped.armor) minRebornRarity += (this.equipped.armor as GameAmor)?.minRebornRarity || 0

    return minRebornRarity
  }

  get maxMemorize(): number {
    let totalSlots = this._maxMemorize

    if (this.hasAffix('MEMORY')) totalSlots += 2

    return totalSlots
  }

  public getAffixValue(affixId: AffixId): number {
    const values = ([this.equipped.weapon, this.equipped.armor] as GameEquipAble[])
      .filter((item) => item?.affix?.id === affixId)
      .map((item) => item!.affix!.value || 0)

    // 장착된 아이템 중 해당 어픽스가 없으면 0, 있으면 최댓값 반환
    return values.length > 0 ? Math.max(...values) : 0
  }

  public getLearnedSkills() {
    const allSkills = getPlayerSkills()

    return Object.values(allSkills).filter((s) => this.memorize.includes(s.id as SkillId))
  }

  getResourceStatus() {
    const isBlood = this.hasAffix('BLOOD')
    return {
      type: isBlood ? 'HP' : 'MP',
      value: isBlood ? this.hp : this.mp,
    }
  }

  canPay(cost: number): boolean {
    if (this.hasAffix('BLOOD')) {
      return this.hp > cost
    }
    return this.mp >= cost
  }

  pay(cost: number): void {
    if (this.hasAffix('BLOOD')) {
      this.hp -= cost
    } else {
      this.mp -= cost
    }
  }

  public hasAffix(affixId: AffixId): boolean {
    const affixes = this.affixes.map((affix) => affix.id)

    return affixes.includes(affixId)
  }

  private initModifiers() {
    necromancerModifiers.forEach((mod) => this.addModifier(mod))
  }

  override onEquipmentChanged() {
    super.onEquipmentChanged()

    this.updateSkeletonLimit()
  }

  get skills() {
    const passiveList = ['resist_confuse'] as string[]

    if (this.hasAffix('ALONE')) {
      passiveList.push('resist_bind')
    }

    return passiveList
  }

  get maxSkeleton() {
    return this.minionManager.maxSkeleton
  }

  get golem() {
    return this.minionManager.golem
  }

  get knight() {
    return this.minionManager.knight
  }

  get party() {
    return this.minionManager.minions
  }

  get minions() {
    return this.party
  }

  get skeletonSubspace() {
    return this.minionManager.skeletonSubspace
  }

  set skeletonSubspace(v) {
    this.minionManager.skeletonSubspace = v
  }

  get subspaceLimit() {
    return this.minionManager.subspaceLimit
  }

  set subspaceLimit(v) {
    this.minionManager.subspaceLimit = v
  }

  get skeleton() {
    return this.minionManager.skeleton
  }

  set skeleton(v) {
    this.minionManager.skeleton = v
  }

  get _maxSkeleton() {
    return this.minionManager._maxSkeleton
  }

  set _maxSkeleton(v) {
    this.minionManager._maxSkeleton = v
  }

  get golemUpgrade() {
    return this.minionManager.golemUpgrade
  }

  set golemUpgrade(v) {
    this.minionManager.golemUpgrade = v
  }

  get knightUpgrade() {
    return this.minionManager.knightUpgrade
  }

  set knightUpgrade(v) {
    this.minionManager.knightUpgrade = v
  }

  get upgradeLimit() {
    return this.minionManager.upgradeLimit
  }

  set upgradeLimit(v) {
    this.minionManager.upgradeLimit = v
  }

  public updateSkeletonLimit() {
    return this.minionManager.updateSkeletonLimit()
  }

  addSkeleton(minion: BattleTarget) {
    return this.minionManager.addSkeleton(minion)
  }

  addMercenary(mercenary: BattleTarget) {
    return this.minionManager.addMercenary(mercenary)
  }

  removeMercenaries() {
    return this.minionManager.removeMercenaries()
  }

  removeMinion(minionId: string) {
    return this.minionManager.removeMinion(minionId)
  }

  dismissMember(id: string) {
    return this.removeMinion(id)
  }

  unlockGolem(type: 'zed' | 'maya') {
    return this.minionManager.unlockGolem(type)
  }

  unlockKnight(skeleton: SkeletonWrapper) {
    return this.minionManager.unlockKnight(skeleton)
  }

  restoreAll() {
    super.restoreAll()
    this.minions.forEach((minion) => {
      minion.isAlive = true
      minion.hp = minion.maxHp
    })
  }
}
