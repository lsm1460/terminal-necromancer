import i18n from '~/i18n'
import { GameContext, NPC, NPCState } from '~/types'
import { NPCManager } from '../../systems/NpcManager'
import { Terminal } from '../Terminal'

export class BaseNPC implements NPC {
  id: string
  faction: string
  reborn: boolean
  relation: number
  isNpc: true = true
  isHostile: boolean
  isBoss: boolean
  factionHostility: number
  factionContribution: number

  // BattleTarget properties
  attackType: 'melee' | 'ranged' | 'explode'
  maxHp: number
  hp: number
  atk: number
  def: number
  agi: number
  exp: number
  dropTableId: string
  encounterRate: number
  isAlive: boolean
  noEscape?: boolean
  noCorpse?: boolean
  minRebornRarity?: any
  orderWeight?: number
  skills?: string[]

  constructor(
    id: string,
    baseData: any,
    state: NPCState,
    protected manager: NPCManager
  ) {
    this.id = id
    this.faction = baseData.faction || ''
    this.reborn = state.reborn
    this.relation = state.relation
    this.isHostile = manager.isHostile(id)
    this.isBoss = baseData.isBoss || false
    this.factionHostility = manager.getFactionHostility(this.faction)
    this.factionContribution = manager.getFactionContribution(this.faction)

    // BattleTarget attributes
    this.attackType = baseData.attackType || 'melee'
    this.maxHp = baseData.maxHp || 100
    this.hp = state.hp
    this.atk = baseData.atk || 0
    this.def = baseData.def || 0
    this.agi = baseData.agi || 0
    this.exp = baseData.exp || 0
    this.dropTableId = baseData.dropTableId || ''
    this.encounterRate = baseData.encounterRate || 0
    this.isAlive = state.isAlive
    this.noEscape = baseData.noEscape
    this.noCorpse = baseData.noCorpse
    this.skills = baseData.skills
    this.minRebornRarity = baseData.minRebornRarity
  }

  get name(): string {
    return i18n.t(`npc.${this.id}.name`)
  }

  get deathLine(): string {
    return i18n.t(`npc.${this.id}.deathLine`)
  }

  get description(): string {
    return i18n.t(`npc.${this.id}.description`)
  }

  get lines(): string[] {
    return (i18n.t(`npc.${this.id}.lines`, { returnObjects: true }) || ['...']) as string[]
  }

  updateHostility(amount: number) {
    this.manager.updateFactionHostility(this.faction, amount)
  }

  updateContribution(amount: number) {
    this.manager.updateFactionContribution(this.faction, amount)
  }

  dead(params?: { karma?: number; hostile?: number }) {
    this.isAlive = false

    this.manager.triggerDeathHandler(this, params)
  }

  hasQuest(context: GameContext) {
    return false
  }

  getChoices(context: GameContext) {
    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  async handle(action: string, context: GameContext): Promise<void | boolean> {}

  handleTalk() {
    if (!this.lines || this.lines.length === 0) {
      Terminal.log(`\n💬 [${this.name}]: ...`)
      return
    }

    const randomIndex = Math.floor(Math.random() * this.lines.length)
    const selectedLine = this.lines[randomIndex]

    Terminal.log(`\n💬 [${this.name}]: "${selectedLine}"`)
  }

  getScripts(greetings: 'greeting' | 'farewell') {
    const hostility = this.faction === 'resistance' ? this.factionHostility : (this.relation || 0) * -1

    let dialect: 'friendly' | 'hostile' | 'normal' = 'normal'
    if (hostility <= -20) dialect = 'friendly'
    else if (hostility >= 40) dialect = 'hostile'

    const key = `npc.${this.id}.scripts.${dialect}.${greetings}`

    return i18n.exists(key) ? i18n.t(key) : '...'
  }

  afterDead(context: GameContext) {}
}
