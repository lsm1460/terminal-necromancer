import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction } from '~/types'
import { ItemType } from '~/types/item'

export const equipCommand: CommandFunction = async (args, {player}) => {
  const inventory = player.inventory

  const equipAbles = inventory.filter((_item) => [ItemType.WEAPON, ItemType.ARMOR].includes(_item.type as ItemType))

  if (equipAbles.length < 1) {
    Terminal.log(i18n.t('commands.equip.no_equippables'))
    return false
  }

  const choices = [
    ...equipAbles.map((item) => ({
      name: item.id,
      message: item.makeItemMessage(player),
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ]

  const itemId = await Terminal.select(i18n.t('commands.equip.select_prompt'), choices)

  if (itemId === 'cancel') {
    return false
  }

  const targetItem = equipAbles.find((i) => i.id === itemId)

  if (targetItem) {
    Terminal.log(i18n.t('commands.equip.success', { name: targetItem.name }))
    await player.equip(targetItem)
  }

  return false
}
