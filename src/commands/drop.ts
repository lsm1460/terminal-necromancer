import { CommandFunction, Terminal } from '~/core'
import { Item } from '~/core/item/Item'
import i18n from '~/i18n'

export const dropCommand: CommandFunction = async (args, context) => {
  const { player, world } = context
  const inventory = player.inventory

  if (inventory.length === 0) {
    Terminal.log(i18n.t('commands.drop.no_items'))
    return false
  }

  let itemToDrop: Item | undefined

  // 1. 인자(args)가 있는 경우: 이름으로 직접 찾기
  if (args.length > 0) {
    args.forEach((name) => {
      const itemIndex = inventory.findIndex((d) => d.origin === name)

      if (itemIndex === -1) {
        Terminal.log(i18n.t('commands.drop.not_found', { name }))
        return
      }

      itemToDrop = inventory[itemIndex]
    })
  } else {
    const itemId = await Terminal.select(i18n.t('commands.drop.select_prompt'), [
      ...inventory.map((item) => ({
        name: item.id,
        message: `${item.name}${item.quantity ? i18n.t('commands.drop.quantity_label', { count: item.quantity }) : ''}`,
      })),
      { name: 'cancel', message: i18n.t('cancel') },
    ])

    if (itemId === 'cancel') return false
    itemToDrop = inventory.find((i) => i.id === itemId)
  }

  // 3. 실제 버리기 로직 처리
  if (itemToDrop) {
    const drop = player.removeItem(itemToDrop.id)

    drop && world.addDrop(drop)

    const qtyText = itemToDrop.quantity !== undefined ? i18n.t('commands.drop.unit') : ''
    Terminal.log(
      i18n.t('commands.drop.success', {
        name: itemToDrop.name,
        qtyText,
      })
    )
  }

  return false
}
