import i18n from '~/i18n'
import npcHandlers from '~/npc'
import { GameContext, NPC, NPCState } from '~/types'
import { Terminal } from '../Terminal'
import { Player } from '../player/Player'
import { NPCManager } from '../NpcManager'

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
  isMinion?: boolean
  isSkeleton?: boolean
  originId?: string
  rarity?: any
  isGolem?: boolean
  madeBy?: string
  isKnight?: boolean
  minRebornRarity?: any
  orderWeight?: number
  skills?: string[]

  constructor(
    id: string,
    baseData: any,
    state: NPCState,
    private manager: NPCManager,
    private player: Player
  ) {
    this.id = id
    this.faction = baseData.faction || ''
    this.reborn = state.reborn
    this.relation = state.relation
    this.isHostile = manager.isHostile(id)
    this.isBoss = baseData.isBoss || false
    // @ts-ignore - Will be added to NPCManager
    this.factionHostility = manager.getFactionHostility?.(this.faction) || 0
    this.factionContribution = manager.getFactionContribution(this.faction) || 0

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
  
  set name(_: string) {}
  set deathLine(_: string | undefined) {}
  set description(_: string) {}
  set lines(_: string[]) {}

  updateHostility(amount: number) {
    this.manager.updateFactionHostility(this.faction, amount)
  }

  updateContribution(amount: number) {
    this.manager.updateFactionContribution(this.faction, amount)
  }

  dead(params?: { karma?: number; hostile?: number }) {
    const { karma = 1, hostile = 100 } = params || {}
    this.player.karma += karma
    this.isAlive = false
    this.manager.setAlive(this.id, false)

    if (this.faction) {
      this.manager.setFactionHostility(this.faction, hostile)
    }

    // @ts-ignore - Will be added/fixed in NPCManager
    this.manager.triggerDeathHandler?.(this.id)
  }

  hasQuest(player: Player, context: GameContext): boolean {
    const handler = npcHandlers[this.id]
    if (!handler) return false

    if (handler.hasQuest) {
      return handler.hasQuest(player, context)
    }

    return false
  }
  
  // For NPCHandler compatibility
  getChoices(player: Player, context: GameContext) {
    const handler = npcHandlers[this.id]
    if (handler) {
      return handler.getChoices(player, this, context)
    }
    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  async handle(action: string, player: Player, context: GameContext) {
    const handler = npcHandlers[this.id]
    if (handler) {
      return await handler.handle(action, player, this, context)
    }
  }
}
