import { BattleTarget, Drop, GameContext, NPC } from '~/types'
import { Player } from '../player/Player'
import { Terminal } from '../Terminal'
import { LootFactory } from '../LootFactory'
import { BattleUnitManager } from './BattleUnitManager'
import { BattleResult } from './types'

export class BattleRewardSystem {
  constructor(
    private player: Player,
    private unitManager: BattleUnitManager
  ) {}

  handleUnitDeath(target: BattleTarget, context: GameContext) {
    const { world, drop: dropTable } = context
    const { x, y } = this.player.pos

    target.hp = 0
    target.isAlive = false
    this.unitManager.unregisterUnit(target)

    Terminal.log(`\n💀 ${target.name}이(가) 쓰러졌습니다!`)
    target.deathLine && Terminal.log(target.deathLine)
    target.isNpc && (target as NPC).dead()

    const { gold, drops } = LootFactory.fromTarget(target, dropTable)

    this.player.gainExp(target.exp || 0)
    this.player.gainGold(gold)

    let logMessage = `✨ ${target.name} 처치! EXP +${target.exp || 0}`
    if (gold > 0) logMessage += `, 골드 +${gold}`
    Terminal.log(logMessage)

    drops.forEach((d) => {
      world.addDrop({ ...d, x, y } as Drop)
      Terminal.log(
        `📦 ${target.name}은(는) ${d.label}${d.quantity !== undefined ? ` ${d.quantity}개` : ''}을(를) 떨어뜨렸습니다.`
      )
    })

    if (!target.noCorpse) {
      world.addCorpse({ ...target, x, y })
      Terminal.log(`🦴 그 자리에 ${target.name}의 시체가 남았습니다.`)
    } else {
      Terminal.log(`${target.name}이/가 연기처럼 사라졌다.`)
    }
  }

  handleBattleEnd(result: BattleResult) {
    if (result.isEscaped) return

    if (result.isVictory) {
      Terminal.log(`\n🏆 전투에서 승리했습니다!`)
    } else {
      Terminal.log(`\n💀 전투에서 패배했습니다...`)
      this.player?.onDeath && this.player.onDeath()
    }
  }
}
