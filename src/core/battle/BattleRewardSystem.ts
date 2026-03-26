import i18n from '~/i18n'
import { BattleTarget, Drop, GameContext, NPC } from '~/types'
import { getItemLabel } from '~/utils'
import { LootFactory } from '../LootFactory'
import { Player } from '../player/Player'
import { Terminal } from '../Terminal'
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

    Terminal.log(i18n.t('battle.reward.unit_death', { name: target.name }))
    target.deathLine && Terminal.log(target.deathLine)
    target.isNpc && (target as NPC).dead()

    const { gold, drops } = LootFactory.fromTarget(target, dropTable)

    this.player.gainExp(target.exp || 0)
    this.player.gainGold(gold)

    let logMessage = i18n.t('battle.reward.kill_log', {
      name: target.name,
      exp: target.exp || 0,
    })

    if (gold > 0) {
      logMessage += i18n.t('battle.reward.gold_gain', { gold })
    }
    Terminal.log(logMessage)

    drops.forEach((d) => {
      world.addDrop({ ...d, x, y } as Drop)
      const quantityText = d.quantity !== undefined ? ` ${d.quantity}${i18n.t('battle.reward.item_unit')}` : ''

      Terminal.log(
        i18n.t('battle.reward.drop_item', {
          name: target.name,
          label: getItemLabel(d).label,
          quantity: quantityText,
        })
      )
    })

    if (!target.noCorpse) {
      world.addCorpse({ ...target, x, y })
      Terminal.log(i18n.t('battle.reward.corpse_left', { name: target.name }))
    } else {
      Terminal.log(i18n.t('battle.reward.vanished', { name: target.name }))
    }
  }

  handleBattleEnd(result: BattleResult) {
    if (result.isEscaped) return

    if (result.isVictory) {
      Terminal.log(i18n.t('battle.reward.victory'))
    } else {
      Terminal.log(i18n.t('battle.reward.defeat'))
      this.player?.onDeath && this.player.onDeath()
    }
  }
}
