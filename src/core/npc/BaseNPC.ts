import { BattleTarget } from '../battle'
import { INpcManager, NPCState } from '../types'

interface INPC extends BattleTarget {}

export class BaseNPC<T = any> implements INPC {
  id: string
  faction: string
  isNpc = true

  reborn: boolean
  relation: number
  hp: number
  isAlive: boolean

  // BattleTarget 기본 스탯
  attackType: 'melee' | 'ranged' | 'explode' = 'melee'
  maxHp = 100
  atk = 0
  def = 0
  agi = 0
  exp = 0
  eva = 0
  dropTableId: string = ''
  encounterRate: number = 0
  isBoss: boolean = false

  noEscape?: boolean
  noCorpse?: boolean
  skills?: string[]

  constructor(
    id: string,
    private baseData: any,
    state: NPCState,
    protected manager: INpcManager
  ) {
    // 데이터 일괄 주입
    Object.assign(this, baseData)

    this.id = id
    this.faction = baseData.faction || ''
    this.reborn = state.reborn
    this.relation = state.relation
    this.hp = state.hp
    this.isAlive = state.isAlive
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

  getCorpse() {
    return {
      maxHp: this.maxHp,
      atk: this.atk,
      def: this.def,
      agi: this.agi,
      name: this.name,
      id: this.id,
    }
  }
}
