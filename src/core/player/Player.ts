import { INIT_MAX_MEMORIZE_COUNT } from '~/consts'
import i18n from '~/i18n'
import {
  Affix,
  AffixId,
  ArmorItem,
  BattleTarget,
  ConsumableItem,
  Item,
  LevelData,
  Skill,
  SKILL_IDS,
  SkillId,
  WeaponItem,
} from '~/types'
import { InventoryManager } from './InventoryManager'
import { MinionManager } from './MinionManager'
import { StatsCalculator } from './StatsCalculator'

export type PlayerSaveData = Partial<Player> & {
  _skeleton?: BattleTarget[]
  _mercenary?: BattleTarget[]
  _golem?: BattleTarget
  _knight?: BattleTarget
}

export class Player {
  id = 'player'
  name = 'player'
  x = 0
  y = 0
  _maxHp = 50
  hp = 50
  _maxMp = 50
  mp = 50
  atk = 10
  def = 5
  agi = 5
  eva = 0
  crit = 0
  gold = 0
  exp = 0
  level = 1
  karma = 0
  _maxMemorize = INIT_MAX_MEMORIZE_COUNT
  memorize: SkillId[] = [SKILL_IDS.RAISE_SKELETON]
  equipped = { weapon: null as WeaponItem | null, armor: null as ArmorItem | null }

  public unlockedSkills: (SkillId | 'SPACE')[] = [SKILL_IDS.RAISE_SKELETON]

  onDeath?: () => void

  private levelTable: LevelData[]
  private inventoryManager: InventoryManager
  private minionManager: MinionManager

  /**
   * @param levelData - 이제 경로 문자열이 아닌 JSON 객체 데이터를 직접 받습니다.
   * @param saved - 저장된 플레이어 데이터
   */
  constructor(levelData: any, saved?: PlayerSaveData) {
    if (saved) {
      const {
        inventory,
        inventoryMax,
        skeletonSubspace,
        subspaceLimit,
        skeleton,
        _maxSkeleton,
        upgradeLimit,
        golemUpgrade,
        knightUpgrade,
        ...rest
      } = saved
      Object.assign(this, rest)
    }

    this.x = 0
    this.y = 0

    this.levelTable = levelData
    this.inventoryManager = new InventoryManager(this, saved)
    this.minionManager = new MinionManager(this, saved)
  }

  get inventory() {
    return this.inventoryManager.inventory
  }

  get inventoryMax() {
    return this.inventoryManager.inventoryMax
  }

  get pos() {
    return { x: this.x, y: this.y }
  }

  get raw() {
    const { levelTable, onDeath, inventoryManager, minionManager, equipped, ...rest } = this as any

    delete equipped?.weapon?.label
    delete equipped?.armor?.label

    const inventoryData = this.inventoryManager.toJSON()
    const minionData = this.minionManager.toJSON()

    return {
      ...rest,
      ...inventoryData,
      ...minionData,
      equipped,
    }
  }

  get maxHp() {
    return StatsCalculator.getMaxHp(this)
  }

  get maxMp() {
    return StatsCalculator.getMaxMp(this)
  }

  get computed() {
    return {
      ...this,
      ...StatsCalculator.getComputed(this),
    }
  }

  get maxSkeleton() {
    return this.minionManager.maxSkeleton
  }

  get maxMemorize() {
    return this._maxMemorize
  }

  get golem() {
    return this.minionManager.golem
  }

  get knight() {
    return this.minionManager.knight
  }

  get minions(): BattleTarget[] {
    return this.minionManager.minions
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

  get isAlive() {
    return this.hp > 0
  }

  set isAlive(_) {
    this.hp = 0
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
    return [this.equipped.weapon, this.equipped.armor]
      .filter((item): item is WeaponItem | ArmorItem => !!item && !!item.affix)
      .flatMap((item) => item.affix!)
  }

  get minRebornRarity() {
    let minRebornRarity = this.getAffixValue('ELITE_SQUAD')

    if (this.equipped.weapon) minRebornRarity += this.equipped.weapon?.minRebornRarity || 0
    if (this.equipped.armor) minRebornRarity += this.equipped.armor?.minRebornRarity || 0

    return minRebornRarity
  }

  public getAffixValue(affixId: AffixId): number {
    const values = [this.equipped.weapon, this.equipped.armor]
      .filter((item) => item?.affix?.id === affixId)
      .map((item) => item!.affix!.value || 0)

    // 장착된 아이템 중 해당 어픽스가 없으면 0, 있으면 최댓값 반환
    return values.length > 0 ? Math.max(...values) : 0
  }

  public hasAffix(affixId: AffixId): boolean {
    const affixes = this.affixes.map((affix) => affix.id)

    return affixes.includes(affixId)
  }

  move(dx: number, dy: number) {
    this.x += dx
    this.y += dy
  }

  damage(value: number): boolean {
    this.hp -= value

    if (this.hp <= 0) {
      this.hp = 0
      if (typeof this.onDeath === 'function') {
        this.onDeath()
      }
      return true // 사망
    }

    return false // 아직 살아있음
  }

  gainExp(exp: number) {
    this.exp += exp
  }

  levelUp() {
    const { toNext: newLevelExp } = this.expToNextLevel()
    const next = this.level + 1
    const levelData = this.levelTable.find((_data) => _data.level === next)

    if (levelData && this.exp >= newLevelExp) {
      this.level += 1
      this.exp = this.exp - newLevelExp

      const { hp, mp, atk, def } = levelData

      this._maxHp += hp
      this._maxMp += mp
      this.atk += atk
      this.def += def

      this.hp = this.maxHp
      this.mp = this.maxMp

      return true
    }

    return false
  }

  gainGold(gold: number) {
    this.gold += gold
  }

  async equip(newItem: Item) {
    return this.inventoryManager.equip(newItem)
  }

  public updateSkeletonLimit() {
    return this.minionManager.updateSkeletonLimit()
  }

  unEquip(slot: keyof typeof this.equipped): boolean {
    return this.inventoryManager.unEquip(slot)
  }

  addItem(newItem: Item) {
    this.inventoryManager.addItem(newItem)
  }

  expToNextLevel(): { required: number; toNext: number } {
    const nextLevel = this.level + 1
    const nextLevelData = this.levelTable.find((l) => l.level === nextLevel)

    if (!nextLevelData) return { required: 0, toNext: 0 }

    return { required: Math.max(nextLevelData.expRequired - this.exp, 0), toNext: nextLevelData.expRequired }
  }

  unlockSkill(skill: Skill) {
    if (!this.hasSkill(skill.id)) {
      this.unlockedSkills.push(skill.id)
      this.exp = Math.max(this.exp - skill.requiredExp, 0)
    }
  }

  hasSkill(skillId: SkillId | 'SPACE'): boolean {
    return this.unlockedSkills.includes(skillId)
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

  removeItem(itemId: string, amount: number = 1): boolean {
    return this.inventoryManager.removeItem(itemId, amount)
  }

  async useItem(targetItem?: ConsumableItem) {
    return this.inventoryManager.useItem(targetItem)
  }

  unlockGolem(type: 'zed' | 'maya') {
    return this.minionManager.unlockGolem(type)
  }

  unlockKnight() {
    return this.minionManager.unlockKnight()
  }

  public recoverHp(amount: number): number {
    const beforeHp = this.hp
    this.hp = Math.min(this.maxHp, this.hp + amount)
    return this.hp - beforeHp // 실제 회복량 반환
  }

  public recoverMp(amount: number): number {
    const beforeMp = this.mp
    this.mp = Math.min(this.maxMp, this.mp + amount)
    return this.mp - beforeMp
  }

  restoreAll() {
    this.hp = this.maxHp
    this.mp = this.maxMp

    this.minions.forEach((minion) => (minion.hp = minion.maxHp))
  }
}
