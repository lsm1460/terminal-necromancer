// core/Player.ts
import enquirer from 'enquirer'
import fs from 'fs'
import { INIT_MAX_MEMORIZE_COUNT } from '~/consts'
import {
  Affix,
  AffixId,
  ArmorItem,
  BattleTarget,
  ConsumableItem,
  Item,
  ItemType,
  LevelData,
  Skill,
  SKILL_IDS,
  SkillId,
  WeaponItem,
} from '~/types'
import GolemWrapper from './GolemWrapper'
import { ItemRarity } from '../item/consts'
import KnightWrapper from './KnightWrapper'

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
  inventoryMax = 15
  inventory: Item[] = []
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

  constructor(levelPath: string, saved?: Partial<Player>) {
    // 저장된 값이 있으면 덮어쓰기
    if (saved) {
      Object.assign(this, saved)
    }

    this.x = 0
    this.y = 0

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
    let attackType = 'melee'

    if (this.equipped.weapon) {
      atk += this.equipped.weapon.atk

      attackType = this.equipped.weapon.attackType || 'melee'
    }
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
      attackType,
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

    const oldItem = this.equipped[slot]
    if (oldItem?.affix?.metadata?.needsConfirmOnUnequip) {
      const caution = oldItem.affix
      const warningMsg =
        caution.metadata?.unEquipCaution || `⚠️ [${caution.name}] 어픽스가 해제됩니다. 진행하시겠습니까?`

      // 사용자 확인 (confirm 시스템이 async라고 가정)
      const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
        type: 'confirm',
        name: 'proceed', // 반환 객체의 키값이 됩니다.
        message: warningMsg,
        initial: false, // 기본 선택값 (default 대신 initial 사용)
      })

      if (!proceed) {
        return false // 교체 중단
      }
    }

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

  async useItem(targetItem?: ConsumableItem) {
    // 1. 소비 아이템만 필터링
    const consumables = this.inventory.filter((item): item is ConsumableItem =>
      [ItemType.CONSUMABLE, ItemType.FOOD].includes(item.type)
    )

    if (consumables.length === 0) {
      console.log('\n🎒 사용할 수 있는 소비 아이템이 없습니다.')
      return false
    }

    if (!targetItem) {
      const { itemId } = await enquirer.prompt<{ itemId: string }>({
        type: 'select',
        name: 'itemId',
        message: '어떤 아이템을 사용하시겠습니까?',
        choices: [
          ...consumables.map((item) => ({
            name: item.id,
            message: `${item.label} (x${item.quantity || 1}) ${
              item.hpHeal ? ` [HP +${item.hpHeal}]` : ''
            }${item.mpHeal ? ` [MP +${item.mpHeal}]` : ''}`,
          })),
          { name: 'cancel', message: '🔙 취소' },
        ],
        format(value) {
          if (value === 'cancel') return '취소'
          const item = consumables.find((i) => i.id === value)

          return item ? item.label : value
        },
      })

      if (itemId === 'cancel') return false
      targetItem = consumables.find((i) => i.id === itemId)
    }

    if (!targetItem) {
      console.log('해당 아이템이 존재하지 않습니다..')
      return false
    }

    // 4. 아이템 사용 효과 적용
    console.log(`\n [${targetItem.label}]을(를) 사용합니다...`)

    // 체력 회복
    if (targetItem.hpHeal) {
      const beforeHp = this.hp
      this.hp = Math.min(this.maxHp, this.hp + targetItem.hpHeal)
      const recovered = this.hp - beforeHp
      console.log(`❤️ 체력이 ${recovered} 회복되었습니다. (현재: ${this.hp}/${this.maxHp})`)
    }

    // 마나 회복
    if (targetItem.mpHeal) {
      const beforeMp = this.mp
      this.mp = Math.min(this.maxMp, this.mp + targetItem.mpHeal)
      const recovered = this.mp - beforeMp
      console.log(`🧪 마나가 ${recovered} 회복되었습니다. (현재: ${this.mp}/${this.maxMp})`)
    }

    // 5. 인벤토리에서 수량 차감 (앞서 만든 removeItem 활용)
    this.removeItem(targetItem.id, 1)

    return true
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
