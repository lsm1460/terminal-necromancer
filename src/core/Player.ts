// core/Player.ts
import fs from 'fs'
import { BattleTarget, Item, LevelData, SKILL_IDS, SkillId } from '../types'

export class Player {
  x = 0
  y = 0
  maxHp = 100
  hp = 100
  mp = 100
  atk = 10
  def = 5
  gold = 0
  totalExp = 0
  level = 1
  inventory: Item[] = []
  equipped = { weapon: null as Item | null, armor: null as Item | null }

  public unlockedSkills: SkillId[] = [SKILL_IDS.RAISE_SKELETON]
  public skeleton: BattleTarget[] = [] // 현재 거느리고 있는 소환수들
  public maxSkeleton: number = 3 // 최대 소환 가능 수

  onDeath?: () => void

  private levelTable: LevelData[]

  constructor(levelPath: string, saved?: Partial<Player>) {
    // 저장된 값이 있으면 덮어쓰기
    if (saved) {
      Object.assign(this, saved)
    }

    // 레벨 테이블 로드
    this.levelTable = JSON.parse(fs.readFileSync(levelPath, 'utf-8'))
  }

  get pos() {
    return { x: this.x, y: this.y }
  }

  get raw() {
    const { levelTable, onDeath, ...rest } = this as any

    return rest
  }

  get computed() {
    let atk = this.atk
    let def = this.def

    if (this.equipped.weapon) atk += 5
    if (this.equipped.armor) def += 3

    return { ...this, atk, def }
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

  private calculateLevel(exp: number): number {
    let current = this.levelTable[0]

    for (const lvl of this.levelTable) {
      if (exp >= lvl.expRequired) current = lvl
      else break
    }

    return current.level
  }

  gainExp(exp: number) {
    this.totalExp += exp

    const newLevel = this.calculateLevel(this.totalExp)
    if (newLevel > this.level) {
      console.log(`레벨 업! LV ${this.level} → LV ${newLevel}`)
      this.level = newLevel
    }
  }

  gainGold(gold: number) {
    this.gold += gold
  }

  equip(_item: Item) {
    if (this.inventory.includes(_item)) {
      // this.equipped.weapon = '검'
      console.log(_item + '을(를) 장착했다!')

      return true
    }

    return false
  }

  clearEquipment() {
    this.inventory = []
    this.equipped.weapon = null
    this.equipped.armor = null
  }

  addItem(newItem: Item) {
    const existing = this.inventory.find((i) => i.id === newItem.id)
    if (existing && existing.quantity && newItem.quantity) {
      existing.quantity += newItem.quantity
    } else {
      this.inventory.push({ ...newItem })
    }
  }

  expToNextLevel(): number {
    const nextLevel = this.level + 1
    const nextLevelData = this.levelTable.find((l) => l.level === nextLevel)
    if (!nextLevelData) return 0 // 최고 레벨
    return nextLevelData.expRequired - this.totalExp
  }

  unlockSkill(skillId: SkillId) {
    if (!this.hasSkill(skillId)) {
      this.unlockedSkills.push(skillId)
    }
  }

  hasSkill(skillId: SkillId): boolean {
    return this.unlockedSkills.includes(skillId)
  }

  addSkeleton(minion: BattleTarget) {
    if (this.skeleton.length < this.maxSkeleton) {
      this.skeleton.push(minion)
      return true
    }

    return false
  }
}
