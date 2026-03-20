import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const ZedHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(player, context)
    const isB3Completed = context.events.isCompleted('second_boss')

    if (quest) {
      return [quest]
    }

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      ...(isB3Completed && player.golem
        ? [{ name: 'upgrade_golem', message: i18n.t('npc.dr_zed.choices.upgrade_golem') }]
        : []),
      { name: 'heal', message: i18n.t('talk.heal') },
    ]
  },
  hasQuest(player, context) {
    return getActiveQuest(player, context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'resistance':
        await handleGossip(context)
        break
      case 'heal':
        handleHeal(player)
        break
      case 'golem':
        await handleAwakeGolem(player, context)
        break
      case 'upgrade_golem':
        await handleUpgradeGolem(player)
        break
      default:
        break
    }
  },
}

function handleHeal(player: Player) {
  player.hp = player.maxHp
  player.mp = player.maxMp

  player.minions.forEach((minion) => {
    minion.isAlive = true
    minion.hp = minion.maxHp
  })

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(i18n.t('npc.dr_zed.heal.title'))

  const medicalLogs = i18n.t('npc.dr_zed.heal.logs', { returnObjects: true }) as string[]
  const randomLog = medicalLogs[Math.floor(Math.random() * medicalLogs.length)]

  Terminal.log(randomLog)
  Terminal.log(i18n.t('npc.dr_zed.heal.success'))
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

async function handleGossip(context: GameContext) {
  const { events } = context
  const alreadyKnowResistance = events.isCompleted('RESISTANCE_BASE')

  let dialogues = i18n.t('npc.dr_zed.gossip.intro', { returnObjects: true }) as string[]

  if (alreadyKnowResistance) {
    dialogues = [...dialogues, ...(i18n.t('npc.dr_zed.gossip.already_know', { returnObjects: true }) as string[])]
  } else {
    dialogues = [...dialogues, ...(i18n.t('npc.dr_zed.gossip.first_time', { returnObjects: true }) as string[])]
  }

  await speak(dialogues)
  events.completeEvent('HEARD_RESISTANCE')
}

async function handleUpgradeGolem(player: Player) {
  const ZED_LIMIT = player.upgradeLimit + 1 // 6

  const machineStacks = player.golemUpgrade.filter((s) => s === 'machine').length
  const soulStacks = player.golemUpgrade.filter((s) => s === 'soul').length
  const totalStacks = player.golemUpgrade.length

  const penaltyMultiplier = 1 + machineStacks * 0.5
  const upgradeCost = Math.floor(500 * (totalStacks + 1) * penaltyMultiplier)
  const removeCost = 1500

  if (machineStacks > 0) {
    const hateLogs = i18n.t('npc.dr_zed.upgrade.machine_hate', { returnObjects: true }) as string[]
    hateLogs.forEach((log) => Terminal.log(log))
  }

  const choices = [
    {
      name: 'soul_upgrade',
      message: i18n.t('npc.dr_zed.upgrade.menu_soul', { cost: upgradeCost }),
    },
    {
      name: 'remove_soul',
      message: i18n.t('npc.dr_zed.upgrade.menu_remove', { cost: removeCost }),
    },
    {
      name: 'exit',
      message: i18n.t('cancel'),
    },
  ]

  const action = await Terminal.select(
    i18n.t('npc.dr_zed.upgrade.status_label', {
      slots: player.golemUpgrade.join(' | ') || 'EMPTY',
      exp: player.exp,
    }),
    choices
  )

  if (action === 'soul_upgrade') {
    if (totalStacks === player.upgradeLimit) {
      Terminal.log(i18n.t('npc.dr_zed.upgrade.limit_reached'))
    } else if (totalStacks >= ZED_LIMIT) {
      Terminal.log(i18n.t('npc.dr_zed.upgrade.hard_limit'))
      return
    }

    if (player.exp < upgradeCost) {
      Terminal.log(i18n.t('npc.dr_zed.upgrade.no_exp'))
      return
    }

    player.exp -= upgradeCost
    player.golemUpgrade.push('soul')

    if (totalStacks === player.upgradeLimit) {
      const successLogs = i18n.t('npc.dr_zed.upgrade.success_limit', { returnObjects: true }) as string[]
      successLogs.forEach((log) => Terminal.log(log))
    } else {
      Terminal.log(i18n.t('npc.dr_zed.upgrade.success_normal'))
    }
  } else if (action === 'remove_soul') {
    if (soulStacks === 0) {
      Terminal.log(i18n.t('npc.dr_zed.upgrade.no_soul'))
      return
    }

    if (player.exp < removeCost) {
      Terminal.log(i18n.t('npc.dr_zed.upgrade.no_money_remove'))
      return
    }

    player.exp -= removeCost
    const lastSoulIndex = player.golemUpgrade.lastIndexOf('soul')
    player.golemUpgrade.splice(lastSoulIndex, 1)

    Terminal.log(i18n.t('npc.dr_zed.upgrade.remove_done'))
  } else if (action === 'exit') {
    Terminal.log(i18n.t('npc.dr_zed.upgrade.exit_msg'))
  }
}

async function handleAwakeGolem(player: Player, context: GameContext) {
  const { events } = context
  if (player.golem) {
    Terminal.log(i18n.t('npc.dr_zed.awake.already_active'))
    return
  }

  const dialogues = i18n.t('npc.dr_zed.awake.dialogues', { returnObjects: true }) as string[]
  await speak(dialogues)

  const proceed = await Terminal.confirm(i18n.t('npc.dr_zed.awake.confirm'))

  if (!proceed) {
    events.completeEvent('golem_generation_denied_zed')
    Terminal.log(i18n.t('npc.dr_zed.awake.denied'))
    return
  }

  player.unlockGolem('zed')

  const successLogs = i18n.t('npc.dr_zed.awake.success', { returnObjects: true }) as string[]
  successLogs.forEach((log) => Terminal.log(log))
}

function getActiveQuest(player: Player, context: GameContext) {
  const { events } = context
  const isB2Completed = events.isCompleted('talk_death_2')
  const isB3Completed = events.isCompleted('second_boss')
  const alreadyHeard = events.isCompleted('HEARD_RESISTANCE')
  const alreadyDenied = events.isCompleted('golem_generation_denied_zed')

  // 1순위: 골렘 각성 (B3 클리어 후, 골렘이 없고, 거절한 적도 없을 때)
  if (isB3Completed && !player.golem && !alreadyDenied) {
    return { name: 'golem', message: i18n.t('npc.dr_zed.choices.awake_golem') }
  }

  // 2순위: 레지스탕스 정보 (B2 클리어 후, 아직 듣지 않았을 때)
  if (isB2Completed && !alreadyHeard) {
    return { name: 'resistance', message: i18n.t('talk.speak') }
  }

  return null
}

export default ZedHandler
