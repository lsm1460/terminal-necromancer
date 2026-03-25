import i18n from '~/i18n'
import { GameContext, ItemType } from '~/types'
import { handleTalk, NPCHandler } from './NPCHandler'
import { getItemLabel, speak } from '~/utils'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'

const KnightHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const quest = getActiveQuest(context)

    if (quest) {
      return [quest]
    }

    return [
      { name: 'talk', message: i18n.t('talk.small_talk') },
      { name: 'upgrade', message: i18n.t('npc._knight.choices.upgrade') },
      { name: 'reset', message: i18n.t('npc._knight.choices.reset') },
    ]
  },
  hasQuest(player, context) {
    return getActiveQuest(context) !== null
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'first':
        await handleFirst(context)
        break
      case 'upgrade':
        await handleUpgrade(player)
        break
      case 'reset':
        await handleReset(player)
        break
      default:
        break
    }
  },
}

async function handleFirst(context: GameContext) {
  const { events } = context
  await speak(i18n.t('npc._knight.first_encounter.lines', { returnObjects: true }) as string[])

  Terminal.log(`\x1b[36m[System] ${i18n.t('npc._knight.first_encounter.system_hint')}\x1b[0m`)

  events.completeEvent('talk_knight')
}

function getActiveQuest(context: GameContext) {
  const { events } = context

  const alreadyTalk = events.isCompleted('talk_knight')

  if (!alreadyTalk) {
    return { name: 'first', message: i18n.t('talk.speak') }
  }

  return null
}

async function handleUpgrade(player: Player) {
  if (player.knightUpgrade.length > player.upgradeLimit) {
    Terminal.log(i18n.t('npc._knight.upgrade.cannot_upgrade'))
    return
  }

  const equipAbles = player.inventory.filter((_item) => [ItemType.WEAPON, ItemType.ARMOR].includes(_item.type))
  const choices = equipAbles.map((item) => ({ name: item.id, message: getItemLabel(item) }))
  choices.push({ name: 'cancel', message: i18n.t('cancel') })
  const selected = await Terminal.select(i18n.t('npc._knight.upgrade.select_title'), choices)

  if (selected === 'cancel') {
    return false
  }

  const proceed = await Terminal.confirm(i18n.t('npc._knight.upgrade.confirm'))

  if (!proceed) {
    Terminal.log(i18n.t('npc._knight.upgrade.cancel'))
    return false
  }

  const targetItem = player.inventory.find((item) => item.id === selected)
  if (!targetItem) {
    return
  }

  player.knightUpgrade.push(targetItem?.rarity || 'COMMON')
  player.removeItem(targetItem.id)
  Terminal.log(i18n.t('npc._knight.upgrade.success'))
}

async function handleReset(player: Player) {
  const cost = player.knightUpgrade.length * 300
  const proceed = await Terminal.confirm(i18n.t('npc._knight.upgrade.reset', { cost }))

  if (!proceed) {
    Terminal.log(i18n.t('npc._knight.reset.cancel'))
    return
  }

  player.knightUpgrade = []

  Terminal.log(i18n.t('npc._knight.reset.success'))
}

export default KnightHandler
