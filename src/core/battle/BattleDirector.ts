import { CombatUnit } from './unit/CombatUnit'

export interface BattleRenderer {
  end(): Promise<void>
  setUnits(units: { playerSide: CombatUnit[]; enemiesSide: CombatUnit[] }): Promise<void>
  playAttack(id: string, skillId?: string): Promise<void>
  playHit(id: string, options: { damage: number; isCritical: boolean }): Promise<void>
  playEscape(id: string): Promise<void>
  playDie(id: string): Promise<void>
}

export class BattleDirector {
  private static renderer: BattleRenderer | null = null

  public static setRenderer(renderer: BattleRenderer): void {
    this.renderer = renderer
  }

  public static async end() {
    if (!this.renderer) return
    await this.renderer.end()
  }

  public static async setUnits(units: { playerSide: CombatUnit[]; enemiesSide: CombatUnit[] }) {
    if (!this.renderer) return
    await this.renderer.setUnits(units)
  }

  public static async playAttack(id: string, skillId?: string) {
    if (!this.renderer) return
    await this.renderer.playAttack(id, skillId)
  }

  public static async playHit(id: string, options: { damage: number; isCritical: boolean }) {
    if (!this.renderer) return
    await this.renderer.playHit(id, options)
  }

  public static async playEscape(id: string) {
    if (!this.renderer) return
    await this.renderer.playEscape(id)
  }

  public static async playDie(id: string) {
    if (!this.renderer) return
    await this.renderer.playDie(id)
  }
}
