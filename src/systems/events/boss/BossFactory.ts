import { BossLogic } from './BossLogic'
import { FirstBoss } from './FirstBoss'
import { SecondBoss } from './SecondBoss'

export class BossFactory {
  private static registry: Record<string, BossLogic> = {
    first_boss: new FirstBoss(),
    second_boss: new SecondBoss(), // 나중에 추가 가능
  }

  static getLogic(bossId: string): BossLogic | undefined {
    return this.registry[bossId]
  }
}
