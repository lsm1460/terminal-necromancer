import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'
import { MayaService } from './service'

export const MayaActions = {
  async handleJoin(context: AppContext) {
    const { player, events, npcs } = context
    const isB3Completed = events.isCompleted('second_boss')
    const { isAlive: jaxIsAlive } = npcs.getNPC('jax_seeker') || {}

    let dialogues: string[] = i18n.t('npc.maya_tech.join.intro', { returnObjects: true }) as string[]
    dialogues.push(i18n.t(jaxIsAlive ? 'npc.maya_tech.join.jax_alive' : 'npc.maya_tech.join.jax_dead'))

    const golemKey = player.golem ? 'has_golem' : isB3Completed ? 'can_make_golem' : 'cannot_make_golem'
    dialogues = [...dialogues, ...(i18n.t(`npc.maya_tech.join.${golemKey}`, { returnObjects: true }) as string[])]

    dialogues.push(i18n.t('npc.maya_tech.join.outro'))
    await speak(dialogues)
    events.completeEvent('maya_1')
  },

  async handleAwakeGolem(player: Necromancer, npc: GameNPC) {
    if (player.golem) {
      Terminal.log(`\n${i18n.t('npc.maya_tech.awake.already_has')}`)
      return
    }

    await speak(i18n.t('npc.maya_tech.awake.dialogues', { returnObjects: true }) as string[])
    if (await Terminal.confirm(i18n.t('npc.maya_tech.awake.confirm'))) {
      player.unlockGolem('maya')
      npc.updateContribution(20)
      const successMsgs = i18n.t('npc.maya_tech.awake.success', { returnObjects: true }) as string[]
      successMsgs.forEach((msg) => Terminal.log(msg))
    } else {
      Terminal.log(i18n.t('npc.maya_tech.awake.cancel'))
    }
  },

  async handleUpgradeGolem(player: Necromancer) {
    Terminal.log(i18n.t('npc.maya_tech.upgrade.welcome'))
    const stats = MayaService.calculateUpgradeStats(player)

    if (stats.soulStacks > 0) {
      const hateMsgs = i18n.t('npc.maya_tech.upgrade.soul_hate', { returnObjects: true }) as string[]
      hateMsgs.forEach((msg) => Terminal.log(msg))
    }

    const action = await Terminal.select(
      i18n.t('npc.maya_tech.upgrade.menu_title', {
        slots: player.golemUpgrade.join(' | ') || 'EMPTY',
        gold: player.gold,
      }),
      [
        {
          name: 'machine_upgrade',
          message: i18n.t('npc.maya_tech.upgrade.choices.machine', { cost: stats.upgradeCost }),
        },
        { name: 'remove_machine', message: i18n.t('npc.maya_tech.upgrade.choices.remove', { cost: stats.removeCost }) },
        { name: 'exit', message: i18n.t('cancel') },
      ]
    )

    if (action === 'machine_upgrade') {
      if (stats.totalStacks >= player.upgradeLimit) {
        Terminal.log(i18n.t('npc.maya_tech.upgrade.full'))
      } else if (player.gold < stats.upgradeCost) {
        Terminal.log(i18n.t('npc.maya_tech.upgrade.no_gold'))
      } else {
        player.gold -= stats.upgradeCost
        player.golemUpgrade.push('machine')
        Terminal.log(i18n.t('npc.maya_tech.upgrade.success_log'))
        Terminal.log(i18n.t('npc.maya_tech.upgrade.success_msg'))
      }
    } else if (action === 'remove_machine' && stats.machineStacks > 0) {
      if (player.gold < stats.removeCost) {
        Terminal.log(i18n.t('npc.maya_tech.upgrade.no_gold'))
      } else {
        player.gold -= stats.removeCost
        player.golemUpgrade.splice(player.golemUpgrade.lastIndexOf('machine'), 1)
        Terminal.log(i18n.t('npc.maya_tech.upgrade.remove_log'))
      }
    }
  },
}
