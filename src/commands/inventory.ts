import { Terminal } from '~/core'
import { Item } from '~/core/item/Item'
import { Player } from '~/core/player/Player'
import { CommandFunction, GameContext, IConsumable, IEquipAble } from '~/core/types'
import i18n from '~/i18n'
import { printItem } from './overview'

export const inventoryCommand: CommandFunction = async (args, context) => {
  const selectedItem = await selectItemFromInventory(context.player)
  if (!selectedItem) return false

  return await handleItemAction(selectedItem, args, context)
}

async function selectItemFromInventory(player: Player): Promise<Item | null> {
  const { inventory } = player

  if (inventory.length === 0) {
    Terminal.log('\n> ' + i18n.t('inventory.empty'))
    return null
  }

  Terminal.log(i18n.t('inventory.title', { usage: player.inventoryUsage, max: player.inventoryMax }))

  const itemChoices = inventory.map((item) => ({
    name: item.id,
    message: item.makeItemMessage(player),
  }))

  itemChoices.push({ name: 'cancel', message: i18n.t('cancel') })

  try {
    const itemId = await Terminal.select(i18n.t('inventory.select_item'), itemChoices)
    if (itemId === 'cancel') return null

    return inventory.find((i) => i.id === itemId) || null
  } catch (error) {
    return null
  }
}

async function handleItemAction(item: Item, args: any, context: GameContext) {
  const label = item.name
  const action = await Terminal.select(i18n.t('inventory.what_to_do', { label }), getAvailableActions(item))

  switch (action) {
    case 'look':
      printItem(item, true)
      break
    case 'equip':
      await context.player.equip(item as IEquipAble)
      Terminal.log(`\n✨ ${i18n.t('inventory.action_equip_done', { label })}`)
      break
    case 'use':
      await context.player.useItem(item as IConsumable)
      break
    case 'drop':
      handleDropAction(item, context)
      break
    case 'back':
      return await inventoryCommand(args, context)
  }

  return false
}

function getAvailableActions(item: Item) {
  const actions = [{ name: 'look', message: `🔍 ${i18n.t('inventory.action_look')}` }]

  if ((item as IEquipAble).isEquipAble) {
    actions.push({ name: 'equip', message: `⚔️ ${i18n.t('inventory.action_equip')}` })
  } else if ((item as IConsumable).isConsumable) {
    actions.push({ name: 'use', message: `🧪 ${i18n.t('inventory.action_use')}` })
  }

  actions.push({ name: 'drop', message: `🗑️ ${i18n.t('inventory.action_drop')}` })
  actions.push({ name: 'back', message: i18n.t('cancel') })

  return actions
}

/**
 * 아이템 버리기 실행
 */
function handleDropAction(item: Item, context: GameContext) {
  const { player, world } = context

  if (player.removeItem(item.id)) {
    world.addDrop(item)
    Terminal.log(`📦 ${i18n.t('inventory.action_drop_done', { label: item.name, count: 1 })}`)
  }
}
