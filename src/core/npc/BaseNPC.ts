import { NPCState, INpcManager } from '../types'

export class BaseNPC<T = any> {
  id: string
  faction: string
  isNpc: true = true

  reborn: boolean
  relation: number
  hp: number
  isAlive: boolean

  // BattleTarget 기본 스탯
  attackType: 'melee' | 'ranged' | 'explode' = 'melee'
  maxHp: number = 100
  atk: number = 0
  def: number = 0
  agi: number = 0
  exp: number = 0
  dropTableId: string = ''
  encounterRate: number = 0
  isBoss: boolean = false

  noEscape?: boolean
  noCorpse?: boolean
  skills?: string[]
  minRebornRarity?: any

  constructor(
    id: string,
    baseData: any,
    state: NPCState,
    protected manager: INpcManager
  ) {
    this.id = id
    this.faction = baseData.faction || ''
    this.reborn = state.reborn
    this.relation = state.relation
    this.hp = state.hp
    this.isAlive = state.isAlive

    // 데이터 일괄 주입
    Object.assign(this, baseData)
  }

  // 상속받는 GameNPC에서 오버라이드할 Getter들
  get name(): string {
    return this.id
  }
  get deathLine(): string {
    return ''
  }
  get description(): string {
    return ''
  }
  get isHostile(): boolean {
    return this.manager.isHostile(this.id)
  }

  public dead(params?: any) {
    this.isAlive = false
    this.manager.triggerDeathHandler(this, params)
  }

  // 확장용 가상 메서드
  public hasQuest(context: T): boolean {
    return false
  }
  public getChoices(context: T): any[] {
    return []
  }
  public async handle(action: string, context: T): Promise<void | boolean> {
    return false
  }
  public getScripts(greetings: 'greeting' | 'farewell'): string {
    if (greetings === 'greeting') {
      return 'hi'
    } else {
      return 'bye'
    }
  }

  afterDead(context: T) {}
}
