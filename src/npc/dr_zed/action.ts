import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext } from '~/types'
import { speak } from '~/utils'
import { ZedService } from './service'

export const ZedActions = {
  handleHeal(player: Player) {
    player.restoreAll()

    Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Terminal.log(i18n.t('npc.dr_zed.heal.title'))
    const medicalLogs = i18n.t('npc.dr_zed.heal.logs', { returnObjects: true }) as string[]
    Terminal.log(medicalLogs[Math.floor(Math.random() * medicalLogs.length)])
    Terminal.log(i18n.t('npc.dr_zed.heal.success'))
    Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  },

  async handleGossip(context: GameContext) {
    const { events } = context
    const alreadyKnow = events.isCompleted('RESISTANCE_BASE')
    let dialogues = i18n.t('npc.dr_zed.gossip.intro', { returnObjects: true }) as string[]

    const branch = alreadyKnow
      ? (i18n.t('npc.dr_zed.gossip.already_know', { returnObjects: true }) as string[])
      : (i18n.t('npc.dr_zed.gossip.first_time', { returnObjects: true }) as string[])

    await speak([...dialogues, ...branch])
    events.completeEvent('HEARD_RESISTANCE')
  },

  async handleAwakeGolem(context: GameContext) {
    const { player, events } = context
    if (player.golem) {
      Terminal.log(i18n.t('npc.dr_zed.awake.already_active'))
      return
    }

    await speak(i18n.t('npc.dr_zed.awake.dialogues', { returnObjects: true }) as string[])
    const proceed = await Terminal.confirm(i18n.t('npc.dr_zed.awake.confirm'))

    if (!proceed) {
      events.completeEvent('golem_generation_denied_zed')
      Terminal.log(i18n.t('npc.dr_zed.awake.denied'))
      return
    }

    player.unlockGolem('zed')
    const logs = i18n.t('npc.dr_zed.awake.success', { returnObjects: true }) as string[]
    logs.forEach((log) => Terminal.log(log))
  },

  async handleUpgradeGolem(player: Player) {
    Terminal.log(i18n.t('npc.dr_zed.upgrade.welcome'))
    const stats = ZedService.calculateUpgradeStats(player)

    if (stats.machineStacks > 0) {
      const logs = i18n.t('npc.dr_zed.upgrade.machine_hate', { returnObjects: true }) as string[]
      logs.forEach((log) => Terminal.log(log))
    }

    const action = await Terminal.select(
      i18n.t('npc.dr_zed.upgrade.status_label', { slots: player.golemUpgrade.join(' | ') || 'EMPTY', exp: player.exp }),
      [
        { name: 'soul_upgrade', message: i18n.t('npc.dr_zed.upgrade.menu_soul', { cost: stats.upgradeCost }) },
        { name: 'remove_soul', message: i18n.t('npc.dr_zed.upgrade.menu_remove', { cost: stats.removeCost }) },
        { name: 'exit', message: i18n.t('cancel') },
      ]
    )

    if (action === 'soul_upgrade') {
      if (stats.isHardLimit) {
        Terminal.log(i18n.t('npc.dr_zed.upgrade.hard_limit'))
      } else if (player.exp < stats.upgradeCost) {
        Terminal.log(i18n.t('npc.dr_zed.upgrade.no_exp'))
      } else {
        player.exp -= stats.upgradeCost
        player.golemUpgrade.push('soul')
        Terminal.log(
          i18n.t(
            stats.totalStacks === player.upgradeLimit
              ? 'npc.dr_zed.upgrade.success_limit'
              : 'npc.dr_zed.upgrade.success_normal'
          )
        )
      }
    } else if (action === 'remove_soul') {
      if (stats.soulStacks === 0) {
        Terminal.log(i18n.t('npc.dr_zed.upgrade.no_soul'))
      } else if (player.exp < stats.removeCost) {
        Terminal.log(i18n.t('npc.dr_zed.upgrade.no_money_remove'))
      } else {
        player.exp -= stats.removeCost
        player.golemUpgrade.splice(player.golemUpgrade.lastIndexOf('soul'), 1)
        Terminal.log(i18n.t('npc.dr_zed.upgrade.remove_done'))
      }
    }
  },
}
