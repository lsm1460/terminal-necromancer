import { ItemType } from '~/types/item'
import { BattleTarget } from '../battle'
import { Item } from '../item/Item'
import { IArmor, IConsumable, IEquipAble, IGameItemFactory, IWeapon, LevelData, PositionType, Skill } from '../types'
import { InventoryManager } from './InventoryManager'
import { StatModifier, StatsCalculator } from './StatsCalculator'

export interface PlayerSaveData extends Partial<Player> {}

export abstract class Player {
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

  equipped = { weapon: null as IWeapon | null, armor: null as IArmor | null }

  public unlockedSkills: string[] = []
  public readonly modifiers: StatModifier[] = []

  onDeath?: () => void

  private levelTable: LevelData[]
  private inventoryManager: InventoryManager

  /**
   * @param levelData - 이제 경로 문자열이 아닌 JSON 객체 데이터를 직접 받습니다.
   * @param saved - 저장된 플레이어 데이터
   */
  constructor(itemFactory: IGameItemFactory, levelData: any, saved?: PlayerSaveData) {
    if (saved) {
      const { inventory, inventoryMax, equipped, ...rest } = saved
      Object.assign(this, rest)
    }

    this.x = 0
    this.y = 0

    this.levelTable = levelData
    this.inventoryManager = new InventoryManager(
      itemFactory,
      this,
      {
        [ItemType.WEAPON]: 'weapon',
        [ItemType.ARMOR]: 'armor',
      },
      saved
    )

    if (saved?.equipped?.weapon) {
      this.equipped.weapon = itemFactory.make<IWeapon>(saved.equipped.weapon)
    }

    if (saved?.equipped?.armor) {
      this.equipped.armor = itemFactory.make<IArmor>(saved.equipped.armor)
    }
  }

  get inventory() {
    return this.inventoryManager.inventory
  }

  get inventoryMax() {
    return this.inventoryManager.inventoryMax
  }

  get pos() {
    return { x: this.x, y: this.y } as PositionType
  }

  get raw() {
    const { levelTable, onDeath, inventoryManager, equipped, ...rest } = this

    const inventoryData = this.inventoryManager.toJSON()

    return {
      ...rest,
      ...inventoryData,
      equipped: {
        armor: equipped.armor ? equipped.armor.raw : null,
        weapon: equipped.weapon ? equipped.weapon.raw : null,
      },
    }
  }

  addModifier(mod: StatModifier) {
    this.modifiers.push(mod)
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

  get isAlive() {
    return this.hp > 0
  }

  set isAlive(_) {
    this.hp = 0
  }

  abstract get description(): string
  abstract get party(): BattleTarget[]
  //skill
  abstract canPay(cost: number): boolean
  abstract pay(cost: number): void
  abstract getLearnedSkills(): Skill[]
  abstract getResourceStatus(): { type: string; value: number }
  //
  abstract hasAffix(name: string): boolean
  abstract dismissMember(id: string): void

  onEquipmentChanged() {}

  get skills() {
    return [] as string[]
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

  async equip(newItem: IEquipAble) {
    return this.inventoryManager.equip(newItem)
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

  hasSkill(skillId: string): boolean {
    return this.unlockedSkills.includes(skillId)
  }

  removeItem(itemId: string, amount: number = 1): Item | void {
    return this.inventoryManager.removeItem(itemId, amount)
  }

  async useItem(targetItem?: IConsumable) {
    return await this.inventoryManager.useItem(targetItem)
  }

  hasItem(id: string) {
    return this.inventoryManager.hasItem(id)
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
  }
}
