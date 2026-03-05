import { BattleRenderer } from '~/core/battle/BattleDirector'
import { useBattleStore } from '~/stores/useBattleStore'

export class WebBattleRenderer implements BattleRenderer {
  private get store() {
    return useBattleStore.getState()
  }

  async end(): Promise<void> {
    this.store.clear()
  }

  async setUnits(units: { playerSide: any[]; enemiesSide: any[] }): Promise<void> {
    this.store.setBattleUnits(units)
  }

  async playAttack(id: string, skillId?: string): Promise<void> {
    await this.store.triggerAction(id, 'ATTACK', skillId)
  }

  async playHit(id: string): Promise<void> {
    await this.store.triggerAction(id, 'HIT')
  }

  async playEscape(id: string): Promise<void> {
    await this.store.triggerAction(id, 'ESCAPE')
    this.store.removeUnit(id)
  }

  async playDie(id: string): Promise<void> {
    await this.store.triggerAction(id, 'DIE')
    this.store.removeUnit(id)
  }
}
