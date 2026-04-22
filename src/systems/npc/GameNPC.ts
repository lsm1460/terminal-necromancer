import { Terminal } from '~/core/Terminal'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { NPCManager } from '../NpcManager'
import { AppContext } from '../types'

export class GameNPC extends BaseNPC {
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
    return (this.manager as NPCManager).getFactionHostility(this.faction)
  }

  get factionContribution(): number {
    return (this.manager as NPCManager).getFactionContribution(this.faction)
  }

  updateHostility(amount: number) {
    ;(this.manager as NPCManager).updateFactionHostility(this.faction, amount)
  }

  updateContribution(amount: number) {
    ;(this.manager as NPCManager).updateFactionContribution(this.faction, amount)
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
}
