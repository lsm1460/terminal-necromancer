import { Item } from '~/core/item/Item'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction, ConsumableItem, Drop, ItemType } from '~/types'
import { printItem } from './overview'

export const inventoryCommand: CommandFunction = async (player, args, context) => {
  const selectedItem = await selectItemFromInventory(player)
  if (!selectedItem) return false

  return await handleItemAction(selectedItem, player, args, context)
}

async function selectItemFromInventory(player: Player): Promise<Item | null> {
  const { inventory } = player

  if (inventory.length === 0) {
    Terminal.log('\n> ' + i18n.t('inventory.empty'))
    return null
  }

  const itemChoices = inventory.map((item) => ({
    name: item.id,
    message: Item.makeItemMessage(item, player),
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

async function handleItemAction(item: Item, player: Player, args: any, context: any) {
  const label = item.name
  const action = await Terminal.select(i18n.t('inventory.what_to_do', { label }), getAvailableActions(item))

  switch (action) {
    case 'look':
      printItem(item, true)
      break
    case 'equip':
      await player.equip(item)
      Terminal.log(`\n✨ ${i18n.t('inventory.action_equip_done', { label })}`)
      break
    case 'use':
      await player.useItem(item as ConsumableItem)
      break
    case 'drop':
      handleDropAction(item, player, context)
      break
    case 'back':
      return await inventoryCommand(player, args, context)
  }

  return false
}

function getAvailableActions(item: Item) {
  const actions = [{ name: 'look', message: `🔍 ${i18n.t('inventory.action_look')}` }]

  if (item.type === ItemType.WEAPON || item.type === ItemType.ARMOR) {
    actions.push({ name: 'equip', message: `⚔️ ${i18n.t('inventory.action_equip')}` })
  } else if (item.type === ItemType.FOOD || item.type === ItemType.CONSUMABLE) {
    actions.push({ name: 'use', message: `🧪 ${i18n.t('inventory.action_use')}` })
  }

  actions.push({ name: 'drop', message: `🗑️ ${i18n.t('inventory.action_drop')}` })
  actions.push({ name: 'back', message: i18n.t('cancel') })

  return actions
}

/**
 * 아이템 버리기 실행
 */
function handleDropAction(item: Item, player: Player, context: any) {
  if (player.removeItem(item.id)) {
    context.world.addDrop(item as Drop)
    Terminal.log(`📦 ${i18n.t('inventory.action_drop_done', { label: item.name, count: 1 })}`)
  }
}
