// core/Player.ts
import fs from 'fs'
import { INIT_MAX_MEMORIZE_COUNT } from '~/consts'
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
import { ItemRarity } from '../item/consts'
import GolemWrapper from './GolemWrapper'
import { InventoryManager } from './InventoryManager'
import KnightWrapper from './KnightWrapper'
import { StatsCalculator } from './StatsCalculator'

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

  skeletonSubspace: BattleTarget[] = []
  subspaceLimit = 15
  public skeleton: BattleTarget[] = [] // 현재 거느리고 있는 소환수들
  _maxSkeleton: number = 2 // 최대 소환 가능 수

  upgradeLimit = 5
  golemUpgrade: ('machine' | 'soul')[] = []
  public _golem: BattleTarget | undefined = undefined
  knightUpgrade: (ItemRarity | 'soul')[] = []
  public _knight: BattleTarget | undefined = undefined

  onDeath?: () => void

  private levelTable: LevelData[]
  private inventoryManager: InventoryManager

  constructor(levelPath: string, saved?: Partial<Player>) {
    if (saved) {
      const { inventory, inventoryMax, ...rest } = saved
      Object.assign(this, rest)
    }

    this.x = 0
    this.y = 0

    // 레벨 테이블 로드
    this.levelTable = JSON.parse(fs.readFileSync(levelPath, 'utf-8'))
    this.inventoryManager = new InventoryManager(this, saved)
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
    const { levelTable, onDeath, inventoryManager, ...rest } = this as any

    return {
      ...rest,
      inventory: this.inventory,
      inventoryMax: this.inventoryMax,
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
    let maxSkeleton = this._maxSkeleton

    if (this.equipped.weapon) maxSkeleton += this.equipped.weapon?.maxSkeleton || 0
    if (this.equipped.armor) maxSkeleton += this.equipped.armor?.maxSkeleton || 0

    const _val = this.getAffixValue('OVERLORD')

    return maxSkeleton + _val
  }

  get maxMemorize() {
    return this._maxMemorize
  }

  get golem() {
    if (!this._golem) {
      return
    }

    return new GolemWrapper(this._golem, this.golemUpgrade, this)
  }

  get knight() {
    if (!this._knight) {
      return
    }

    return new KnightWrapper(this._knight, this)
  }

  get minions(): BattleTarget[] {
    const _skeletons = this.skeleton
      .sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0))
      .map((skeleton) => {
        // 1. 기존에 들어있을 수 있는 어픽스 관련 스킬들을 한 번에 제거
        const affixSkillIds = ['death_destruct', 'frostborne']
        let currentSkills = (skeleton.skills || []).filter((id) => !affixSkillIds.includes(id))

        if (this.hasAffix('DOOMSDAY')) {
          currentSkills.push('death_destruct')
        }

        if (this.hasAffix('FROSTBORNE')) {
          currentSkills.push('frostborne')
        }

        skeleton.skills = currentSkills

        return skeleton
      })

    return [this.golem, ..._skeletons, this.knight].filter((_minion) => !!_minion)
  }

  get isAlive() {
    return this.hp > 0
  }

  set isAlive(_) {
    this.hp = 0
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
    const currentMax = this.maxSkeleton // [군주] 어픽스가 계산된 최신 Max값

    // 현재 해골 수가 줄어든 최대치보다 많다면?
    while (this.skeleton.length > currentMax) {
      // 1. 가장 마지막에 추가된(최근 소환된) 해골을 제거
      const removedSkeleton = this.skeleton.pop()

      if (removedSkeleton) {
        console.log(` └ ⚠️ 장비가 해제되어 ${removedSkeleton.name}이(가) 소멸했습니다.`)
      }
    }
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
    if (this.skeleton.length < this.maxSkeleton) {
      this.skeleton.push(minion)
      return true
    }

    return false
  }

  removeMinion(minionId: string) {
    this.skeleton = this.skeleton.filter((_minion) => _minion.id !== minionId)

    if (this._golem && this._golem.id === minionId) {
      this._golem = {
        ...this._golem,
        isAlive: false,
      }
    }

    if (this._knight && this._knight.id === minionId) {
      this._knight = {
        ...this._knight,
        isAlive: false,
      }
    }
  }

  removeItem(itemId: string, amount: number = 1): boolean {
    return this.inventoryManager.removeItem(itemId, amount)
  }

  async useItem(targetItem?: ConsumableItem) {
    return this.inventoryManager.useItem(targetItem)
  }

  unlockDarkKnight() {
    if (this._knight) {
      return
    }

    this._knight = {
      id: 'knight',
      name: '기사 발타자르',
      attackType: 'melee',
      hp: 10,
      baseMaxHp: 10,
      maxHp: 10,
      baseAtk: 12,
      atk: 12,
      baseDef: 12,
      def: 5,
      eva: 0.15,
      exp: 0,
      agi: 5,
      encounterRate: 0,
      isAlive: true,
      isMinion: true,
      isKnight: true,
      deathLine: '발타자르: "아직은... 쉴 수 없는데... (발타자르의 안광이 흐릿해지며 갑옷이 무너져 내립니다.)"',
      description:
        '성역의 시종장이라는 굴레를 벗어던지고 다시 당신의 기사가 된 자. 이전보다 더욱 짙은 죽음의 기운을 뿜어냅니다.',
      dropTableId: '',
      skills: ['power_smash'],
    }

    console.log('[영혼이 귀속된 발타자르]를 획득했다.')
  }

  restoreAll() {
    this.hp = this.maxHp
    this.mp = this.maxMp

    this.minions.forEach((minion) => (minion.hp = minion.maxHp))
  }
}
