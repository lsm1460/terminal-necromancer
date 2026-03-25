import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleBuy, handleSell, handleTalk, NPCHandler, ShopScripts } from './NPCHandler'

const MayaHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(player, context)

    if (quest) {
      return [quest]
    }

    const hasGolem = !!player.golem
    const canUpgrade = npc.factionContribution > 40 && context.events.isCompleted('second_boss') && !!player.golem

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'buy', message: i18n.t('talk.buy') },
      { name: 'sell', message: i18n.t('talk.sell') },
      ...(!hasGolem ? [{ name: 'golem', message: i18n.t('npc.maya_tech.choices.golem') }] : []),
      ...(canUpgrade ? [{ name: 'upgrade_golem', message: i18n.t('npc.maya_tech.choices.upgrade') }] : []),
    ]
  },
  hasQuest(player, context) {
    return getActiveQuest(player, context) !== null
  },
  async handle(action, player, npc, context) {
    const buyScripts = i18n.t('npc.maya_tech.buy', { returnObjects: true }) as ShopScripts
    const sellScripts = i18n.t('npc.maya_tech.sell', { returnObjects: true }) as ShopScripts

    switch (action) {
      case 'join':
        await handleJoin(player, context)
        break
      case 'talk':
        handleTalk(npc)
        break
      case 'buy':
        await handleBuy(player, npc, context, 'resistance_shop', buyScripts)
        break
      case 'sell':
        await handleSell(player, npc, context, sellScripts)
        break
      case 'golem':
        await handleAwakeGolem(player, npc, context)
        break
      case 'upgrade_golem':
        await handleUpgradeGolem(player)
        break
      default:
        break
    }
  },
}

async function handleJoin(player: Player, context: GameContext) {
  const { events, npcs } = context
  const isB3Completed = context.events.isCompleted('second_boss')
  const hasGolem = !!player.golem
  const canMakeGolem = isB3Completed && !hasGolem
  const { isAlive: jaxIsAlive } = npcs.getNPC('jax_seeker') || {}

  let dialogues: string[] = i18n.t('npc.maya_tech.join.intro', { returnObjects: true }) as string[]

  if (jaxIsAlive) {
    dialogues.push(i18n.t('npc.maya_tech.join.jax_alive'))
  } else {
    dialogues.push(i18n.t('npc.maya_tech.join.jax_dead'))
  }

  if (hasGolem) {
    dialogues = [...dialogues, ...(i18n.t('npc.maya_tech.join.has_golem', { returnObjects: true }) as string[])]
  } else if (canMakeGolem) {
    dialogues = [...dialogues, ...(i18n.t('npc.maya_tech.join.can_make_golem', { returnObjects: true }) as string[])]
  } else {
    dialogues = [...dialogues, ...(i18n.t('npc.maya_tech.join.cannot_make_golem', { returnObjects: true }) as string[])]
  }

  dialogues.push(i18n.t('npc.maya_tech.join.outro'))
  await speak(dialogues)
  events.completeEvent('maya_1')
}

async function handleAwakeGolem(player: Player, npc: NPC, context: GameContext) {
  if (player.golem) {
    Terminal.log(`\n${i18n.t('npc.maya_tech.awake.already_has')}`)
    return
  }

  await speak(i18n.t('npc.maya_tech.awake.dialogues', { returnObjects: true }) as string[])

  const proceed = await Terminal.confirm(i18n.t('npc.maya_tech.awake.confirm'))
  if (!proceed) {
    Terminal.log(i18n.t('npc.maya_tech.awake.cancel'))
    return
  }

  player.unlockGolem('maya')
  npc.updateContribution(20)

  const successMsgs = i18n.t('npc.maya_tech.awake.success', { returnObjects: true }) as string[]
  successMsgs.forEach((msg) => Terminal.log(msg))
}

async function handleUpgradeGolem(player: Player) {
  const machineStacks = player.golemUpgrade.filter((s) => s === 'machine').length
  const soulStacks = player.golemUpgrade.filter((s) => s === 'soul').length
  const totalStacks = player.golemUpgrade.length

  const penaltyMultiplier = 1 + soulStacks * 0.5
  const upgradeCost = Math.floor(1000 * (totalStacks + 1) * penaltyMultiplier)
  const removeCost = 3000

  if (soulStacks > 0) {
    const hateMsgs = i18n.t('npc.maya_tech.upgrade.soul_hate', { returnObjects: true }) as string[]
    hateMsgs.forEach((msg) => Terminal.log(msg))
  }

  const choices = [
    {
      name: 'machine_upgrade',
      message: i18n.t('npc.maya_tech.upgrade.choices.machine', { cost: upgradeCost }),
    },
    {
      name: 'remove_machine',
      message: i18n.t('npc.maya_tech.upgrade.choices.remove', { cost: removeCost }),
    },
    {
      name: 'exit',
      message: i18n.t('cancel'),
    },
  ]

  const action = await Terminal.select(
    i18n.t('npc.maya_tech.upgrade.menu_title', {
      slots: player.golemUpgrade.join(' | ') || 'EMPTY',
      gold: player.gold,
    }),
    choices
  )

  if (action === 'machine_upgrade') {
    if (totalStacks >= player.upgradeLimit) {
      Terminal.log(i18n.t('npc.maya_tech.upgrade.full'))
      return
    }
    if (player.gold < upgradeCost) {
      Terminal.log(i18n.t('npc.maya_tech.upgrade.no_gold'))
      return
    }
    player.gold -= upgradeCost
    player.golemUpgrade.push('machine')
    Terminal.log(i18n.t('npc.maya_tech.upgrade.success_log'))
    Terminal.log(i18n.t('npc.maya_tech.upgrade.success_msg'))
  } else if (action === 'remove_machine') {
    if (machineStacks === 0) {
      Terminal.log(i18n.t('npc.maya_tech.upgrade.no_parts'))
      return
    }
    if (player.gold < removeCost) {
      Terminal.log(i18n.t('npc.maya_tech.upgrade.no_gold'))
      return
    }
    player.gold -= removeCost
    const lastMachineIndex = player.golemUpgrade.lastIndexOf('machine')
    player.golemUpgrade.splice(lastMachineIndex, 1)
    Terminal.log(i18n.t('npc.maya_tech.upgrade.remove_log'))
    Terminal.log(i18n.t('npc.maya_tech.upgrade.remove_msg'))
  } else if (action === 'exit') {
    Terminal.log(i18n.t('npc.maya_tech.upgrade.exit_msg'))
  }
}

function getActiveQuest(player: Player, context: GameContext) {
  const isJoined = context.events.isCompleted('RESISTANCE_BASE')
  const isAlreadyMet = context.events.isCompleted('maya_1')
  const isB3Completed = context.events.isCompleted('second_boss')
  const hasGolem = !!player.golem

  // 1순위: 첫 대면 (레지스탕스 가입 후 아직 대화하지 않음)
  if (isJoined && !isAlreadyMet) {
    return { name: 'join', message: i18n.t('talk.speak') }
  }

  // 2순위: 골렘 제작 (B3 클리어 후 골렘이 없음)
  if (isB3Completed && !hasGolem) {
    return { name: 'golem', message: i18n.t('npc.maya_tech.choices.golem') }
  }

  return null
}

export default MayaHandler
