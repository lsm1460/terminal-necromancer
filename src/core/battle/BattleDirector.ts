import { CombatUnit } from './CombatUnit'

export interface BattleRenderer {
  start(): Promise<void>
  end(): Promise<void>
  setUnits(units: { playerSide: CombatUnit[]; enemiesSide: CombatUnit[] }): Promise<void>
  playAttack(id: string, targetId: string, skillId?: string): Promise<void>
  playHit(id: string): Promise<void>
  playDie(id: string): Promise<void>
}

export class BattleDirector {
  private static renderer: BattleRenderer | null = null

  public static setRenderer(renderer: BattleRenderer): void {
    this.renderer = renderer
  }

  public static async start() {
    if (!this.renderer) return
    await this.renderer.start()
  }

  public static async end() {
    if (!this.renderer) return
    await this.renderer.end()
  }

  public static async setUnits(units: { playerSide: CombatUnit[]; enemiesSide: CombatUnit[] }) {
    if (!this.renderer) return
    await this.renderer.setUnits(units)
  }

  public static async playAttack(id: string, targetId: string, skillId?: string) {
    if (!this.renderer) return
    await this.renderer.playAttack(id, targetId, skillId)
  }

  public static async playHit(id: string) {
    if (!this.renderer) return
    await this.renderer.playHit(id)
  }

  public static async playDie(id: string) {
    if (!this.renderer) return
    await this.renderer.playDie(id)
  }
}
