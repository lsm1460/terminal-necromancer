import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction, Drop, Item } from '~/types'
import { getItemLabel } from '~/utils'

export const dropCommand: CommandFunction = async (player, args, context) => {
  const inventory = player.inventory

  if (inventory.length === 0) {
    Terminal.log(i18n.t('commands.drop.no_items'))
    return false
  }

  let itemToDrop: Item | undefined

  // 1. 인자(args)가 있는 경우: 이름으로 직접 찾기
  if (args.length > 0) {
    args.forEach((name) => {
      const itemIndex = inventory.findIndex((d) => {
        const { origin } = getItemLabel(d)

        return origin === name
      })

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
        message: `${getItemLabel(item).label}${
          item.quantity ? i18n.t('commands.drop.quantity_label', { count: item.quantity }) : ''
        }`,
      })),
      { name: 'cancel', message: i18n.t('cancel') },
    ])

    if (itemId === 'cancel') return false
    itemToDrop = inventory.find((i) => i.id === itemId)
  }

  // 3. 실제 버리기 로직 처리
  if (itemToDrop) {
    player.removeItem(itemToDrop.id)

    context.world.addDrop({
      ...itemToDrop,
      quantity: 1,
      x: player.x,
      y: player.y,
    } as Drop)

    const qtyText = itemToDrop.quantity !== undefined ? i18n.t('commands.drop.unit') : ''
    Terminal.log(
      i18n.t('commands.drop.success', {
        name: getItemLabel(itemToDrop).label,
        qtyText,
      })
    )
  }

  return false
}
