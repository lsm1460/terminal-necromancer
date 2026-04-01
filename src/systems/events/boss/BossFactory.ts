import { BossLogic } from './BossLogic'
import { FinalBoss } from './FinalBoss'
import { FirstBoss } from './FirstBoss'
import { SecondBoss } from './SecondBoss'
import { ThirdBoss } from './ThirdBoss'

export class BossFactory {
  private static registry: Record<string, BossLogic> = {
    first_boss: new FirstBoss(),
    second_boss: new SecondBoss(),
    third_boss: new ThirdBoss(),
    death: new FinalBoss()
  }

  static getLogic(bossId: string): BossLogic | undefined {
    return this.registry[bossId]
  }
}
