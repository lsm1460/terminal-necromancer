import { SkeletonRarity } from '~/consts'
import { INpcManager, NPCState, Terminal } from '~/core'
import { BaseNPC } from '~/core/npc/BaseNPC'
import i18n from '~/i18n'
import { NPCManager } from '../NpcManager'
import { AppContext } from '../types'

export class GameNPC extends BaseNPC {
  minRebornRarity?: SkeletonRarity

  constructor(
    id: string,
    baseData: any,
    state: NPCState,
    protected manager: INpcManager
  ) {
    super(id, baseData, state, manager)

    this.minRebornRarity = baseData.minRebornRarity
  }

  get _manager() {
    return this.manager as NPCManager
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

  get factionHostility(): number {
    return this._manager.getFactionHostility(this.faction)
  }

  get factionContribution(): number {
    return this._manager.getFactionContribution(this.faction)
  }

  updateHostility(amount: number) {
    this._manager.updateFactionHostility(this.faction, amount)
  }

  updateContribution(amount: number) {
    this._manager.updateFactionContribution(this.faction, amount)
  }

  handleTalk() {
    if (!this.lines || this.lines.length === 0) {
      Terminal.log(`\n💬 [${this.name}]: ...`)
      return
    }

    const randomIndex = Math.floor(Math.random() * this.lines.length)
    const selectedLine = this.lines[randomIndex]
    Terminal.log(`\n💬 [${this.name}]: "${selectedLine}"`)
  }

  getScripts(greetings: 'greeting' | 'farewell'): string {
    const hostility = this.faction === 'resistance' ? this.factionHostility : (this.relation || 0) * -1

    let dialect: 'friendly' | 'hostile' | 'normal' = 'normal'
    if (hostility <= -20) dialect = 'friendly'
    else if (hostility >= 40) dialect = 'hostile'

    const key = `npc.${this.id}.scripts.${dialect}.${greetings}`
    return i18n.exists(key) ? i18n.t(key) : '...'
  }

  override getChoices(context: AppContext) {
    return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
  }

  override afterDead(context: AppContext) {}

  getCorpse() {
    return {
      id: this.id,
      maxHp: this.maxHp,
      atk: this.atk,
      def: this.def,
      agi: this.agi,
      name: this.name,
      minRebornRarity: this.minRebornRarity
    }
  }
}
