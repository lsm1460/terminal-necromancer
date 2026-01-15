// core/Player.ts
import fs from 'fs'
import { INIT_MAX_MEMORIZE_COUNT } from '../consts'
import { AffixId, ArmorItem, BattleTarget, Item, ItemType, LevelData, SKILL_IDS, SkillId, WeaponItem } from '../types'

export class Player {
  x = 0
  y = 0
  _maxHp = 100
  hp = 100
  _maxMp = 100
  mp = 100
  atk = 10
  def = 5
  agi = 5
  eva = 0
  crit = 0
  gold = 0
  exp = 0
  level = 1
  inventoryMax = 15
  inventory: Item[] = []
  _maxMemorize = INIT_MAX_MEMORIZE_COUNT
  memorize: SkillId[] = [SKILL_IDS.RAISE_SKELETON]
  equipped = { weapon: null as WeaponItem | null, armor: null as ArmorItem | null }

  public unlockedSkills: SkillId[] = [SKILL_IDS.RAISE_SKELETON]
  public skeleton: BattleTarget[] = [] // 현재 거느리고 있는 소환수들
  _maxSkeleton: number = 3 // 최대 소환 가능 수

  public golem: BattleTarget | undefined = undefined
  public _knight: BattleTarget | undefined = undefined

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

  get maxHp() {
    let maxHp = this._maxHp

    if (this.equipped.weapon) maxHp += this.equipped.weapon?.hp || 0
    if (this.equipped.armor) maxHp += this.equipped.armor?.hp || 0

    return maxHp
  }

  get maxMp() {
    let maxMp = this._maxMp

    if (this.equipped.weapon) maxMp += this.equipped.weapon?.mp || 0
    if (this.equipped.armor) maxMp += this.equipped.armor?.mp || 0

    return maxMp
  }

  get computed() {
    let atk = this.atk
    let crit = this.crit
    let def = this.def
    let eva = this.eva

    if (this.equipped.weapon) atk += this.equipped.weapon.atk
    if (this.equipped.weapon) crit += this.equipped.weapon.crit
    if (this.equipped.armor) def += this.equipped.armor.def
    if (this.equipped.armor) eva += this.equipped.armor?.eva || 0

    return {
      ...this,
      maxHp: this.maxHp,
      maxMp: this.maxMp,
      atk,
      crit,
      def,
      eva,
    }
  }

  get maxSkeleton() {
    let maxSkeleton = this._maxSkeleton

    const _val = this.getAffixValue('OVERLORD')

    return maxSkeleton + _val
  }

  get maxMemorize() {
    return this._maxMemorize
  }

  get knight() {
    return this._knight
  }

  get minions(): BattleTarget[] {
    const _skeletons = this.skeleton.sort((a, b) => (b?.orderWeight || 0) - (a?.orderWeight || 0))

    return [this.golem, ..._skeletons, this.knight].filter((_minion) => !!_minion).filter((_minion) => _minion.isAlive)
  }

  get isAlive() {
    return this.hp > 0
  }

  set isAlive(_) {
    this.hp = 0
  }

  get affixes(): AffixId[] {
    return [this.equipped.weapon, this.equipped.armor]
      .filter((item): item is WeaponItem | ArmorItem => !!item && !!item.affix)
      .flatMap((item) => item.affix!.id) // ID만 추출하여 평탄화
  }

  public getAffixValue(affixId: AffixId): number {
    const values = [this.equipped.weapon, this.equipped.armor]
      .filter((item) => item?.affix?.id === affixId)
      .map((item) => item!.affix!.value || 0)

    // 장착된 아이템 중 해당 어픽스가 없으면 0, 있으면 최댓값 반환
    return values.length > 0 ? Math.max(...values) : 0
  }

  public hasAffix(affixId: AffixId): boolean {
    // any를 써서 검사하거나, getter를 활용
    return this.affixes.includes(affixId)
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
    const newLevelExp = this.expToNextLevel()
    if (this.exp >= newLevelExp) {
      this.level += 1
      this.exp = this.exp - newLevelExp

      const levelData = this.levelTable.find((_data) => _data.level === this.level)
      if (levelData) {
        const { hp, mp, atk, def } = levelData

        this._maxHp += hp
        this._maxMp += mp
        this.atk += atk
        this.def += def
      }

      this.hp = this.maxHp
      this.mp = this.maxMp

      return true
    }

    return false
  }

  gainGold(gold: number) {
    this.gold += gold
  }

  equip(newItem: Item): boolean {
    const itemIndex = this.inventory.findIndex((i) => i.id === newItem.id)
    if (itemIndex === -1) {
      console.log('❌ 인벤토리에 해당 아이템이 없습니다.')
      return false
    }

    const slotMap: Record<string, keyof typeof this.equipped> = {
      [ItemType.WEAPON]: 'weapon',
      [ItemType.ARMOR]: 'armor',
      // [ItemType.RING]: 'ring' 등 추가 가능
    }

    const slot = slotMap[newItem.type]
    if (!slot) {
      console.log('⚠️ 장착할 수 없는 아이템 타입입니다.')
      return false
    }

    // TODO: 장비를 바꾸기 전 어픽스 벨릳이션 추가해야함

    const oldItem = this.equipped[slot]
    if (slot === 'weapon') {
      this.equipped.weapon = newItem as WeaponItem
    } else if (slot === 'armor') {
      this.equipped.armor = newItem as ArmorItem
    }

    const updatedInventory = this.inventory.filter((i) => i.id !== newItem.id)

    if (oldItem) {
      updatedInventory.push(oldItem)
    }

    this.inventory = updatedInventory

    this.updateSkeletonLimit()

    return true
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
    const item = this.equipped[slot]
    if (!item) return false

    this.equipped[slot] = null
    this.inventory.push(item)

    return true
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
    return Math.max(nextLevelData.expRequired - this.exp, 0)
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

  removeMinion(minionId: string) {
    this.skeleton = this.skeleton.filter((_minion) => _minion.id !== minionId)

    if (this.golem && this.golem.id === minionId) {
      this.golem = {
        ...this.golem,
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
    const itemIndex = this.inventory.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      console.log('❌ 인벤토리에 해당 아이템이 없습니다.')
      return false
    }

    const targetItem = this.inventory[itemIndex]

    // 1. 수량이 없는 아이템이거나, 전체 제거(-1) 요청인 경우
    if (!targetItem.quantity || amount === -1) {
      this.inventory.splice(itemIndex, 1)
      return true
    }

    // 2. 수량이 있는 아이템인 경우
    if (targetItem.quantity > amount) {
      // 수량만 감소
      targetItem.quantity -= amount
    } else {
      // 요청 수량이 보유 수량보다 많거나 같으면 리스트에서 삭제
      this.inventory.splice(itemIndex, 1)
    }

    return true
  }
}
