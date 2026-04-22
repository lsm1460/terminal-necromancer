import { DropSystem } from '~/core/item/DropSystem'
import i18n from '~/i18n'
import { BattleTarget } from '~/types'
import { LootFactory } from '../LootFactory'
import { BaseNPC } from '../npc/BaseNPC'
import { Player } from '../player/Player'
import { Terminal } from '../Terminal'
import { World } from '../World'
import { BattleUnitManager } from './BattleUnitManager'
import { BattleResult } from './types'

export class BattleRewardSystem {
  constructor(
    private player: Player,
    private unitManager: BattleUnitManager,
    private world: World,
    private dropSystem: DropSystem
  ) {}

  handleUnitDeath(target: BattleTarget) {
    const { x, y } = this.player.pos

    target.hp = 0
    target.isAlive = false
    this.unitManager.unregisterUnit(target)

    Terminal.log(i18n.t('battle.reward.unit_death', { name: target.name }))
    target.deathLine && Terminal.log(target.deathLine)
    target.isNpc && (target as BaseNPC).dead()

    const { gold, drops } = LootFactory.fromTarget(target, this.dropSystem)

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
      this.world.addDrop(d)
      const quantityText = d.quantity !== undefined ? ` ${d.quantity}${i18n.t('battle.reward.item_unit')}` : ''

      Terminal.log(
        i18n.t('battle.reward.drop_item', {
          name: target.name,
          label: d.name,
          quantity: quantityText,
        })
      )
    })

    if (!target.noCorpse) {
      this.world.addCorpse({
        maxHp: target.maxHp,
        atk: target.atk,
        def: target.def,
        agi: target.agi,
        name: target.name,
        id: target.id,
        minRebornRarity: target.minRebornRarity,
        x,
        y,
      })
      Terminal.log(i18n.t('battle.reward.corpse_left', { name: target.name }))
    } else {
      Terminal.log(i18n.t('battle.reward.vanished', { name: target.name }))
    }
  }

  handleBattleEnd(result: BattleResult, callbacks?: { onVictory?: () => void }) {
    if (result.isEscaped) return

    if (result.isVictory) {
      Terminal.log(i18n.t('battle.reward.victory'))
      callbacks?.onVictory?.()
    } else {
      Terminal.log(i18n.t('battle.reward.defeat'))
      this.player?.onDeath && this.player.onDeath()
    }
  }
}
