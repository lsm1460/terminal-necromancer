import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction, Drop, GameContext, LootBag } from '~/types'
import { getItemLabel, makeItemMessage } from '~/utils'

export const pickCommand: CommandFunction = async (player, args, context) => {
  const { x, y } = player.pos
  const tile = context.map.getTile(x, y)

  const drops = context.world.getDropsAt(player.x, player.y)
  const lootBag = context.world.getLootBagAt(context.map.currentSceneId, tile.id)
  const availableSpace = getAvailableSpace(player)

  if (!hasPickableItems(drops, lootBag)) return false
  if (!checkInventorySpace(availableSpace, player)) return false

  const [arg] = args
  
  let drop: Drop | undefined

  if (arg) {
    if (arg === 'lootBag' && lootBag) {
      handleLootBagPick(player, lootBag, context)

      return false
    }
    
    drop = drops.find((d) => getItemLabel(d).origin === arg)

    if (!drop) {
      Terminal.log(i18n.t('item_not_found'))
      return false
    }
  } else {
    const choices = makeDropTargetOptions(drops, player, lootBag)
    const selectionId = await Terminal.select(i18n.t('pick.select_target', { space: availableSpace }), choices)
    if (!selectionId || selectionId === 'cancel') return false

    if (selectionId === 'lootBag' && lootBag) {
      handleLootBagPick(player, lootBag, context)

      return false
    }

    drop = drops.find((d) => d.id === selectionId)
  }

  if (drop) {
    handleItemPick(drop, player, availableSpace, context)
  }

  return false
}

function getAvailableSpace(player: Player): number {
  const currentTotal = player.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)
  return player.inventoryMax - currentTotal
}

function hasPickableItems(drops: Drop[], lootBag?: LootBag): boolean {
  if (!drops.length && !lootBag) {
    Terminal.log('\n' + i18n.t('pick.nothing_to_pick'))
    return false
  }
  return true
}

function checkInventorySpace(space: number, player: Player): boolean {
  if (space <= 0) {
    const current = player.inventoryMax - space // 혹은 위에서 계산된 값 전달
    Terminal.log(`\n🎒 ${i18n.t('pick.inventory_full', { current, max: player.inventoryMax })}`)
    Terminal.log(i18n.t('pick.inventory_full_tip'))
    return false
  }
  return true
}

const makeDropTargetOptions = (drops: Drop[], player: Player, lootBag?: LootBag) => [
  ...(lootBag
    ? [
        {
          name: 'lootBag',
          message: i18n.t('pick.lootbag_choice', { exp: lootBag.exp, gold: lootBag.gold }),
        },
      ]
    : []),
  ...drops.map((d) => ({ name: d.id, message: makeItemMessage(d, player) })),
  { name: 'cancel', message: i18n.t('cancel') },
]

function handleLootBagPick(player: Player, lootBag: LootBag, context: GameContext) {
  Terminal.log(`\n${i18n.t('pick.lootbag_recover_msg', { exp: lootBag.exp, gold: lootBag.gold })}`)
  Terminal.log(`"${i18n.t('pick.lootbag_flavor_text')}"`)

  player.gainExp(lootBag.exp)
  player.gainGold(lootBag.gold)
  context.world.removeLootBag()
}

function handleItemPick(drop: Drop, player: Player, availableSpace: number, context: GameContext) {
  const totalDropQty = drop.quantity || 1
  const pickQty = Math.min(totalDropQty, availableSpace)
  const remainQty = totalDropQty - pickQty

  player.addItem({ ...drop, quantity: pickQty })

  const label = getItemLabel(drop).label
  Terminal.log(`\n✨ ${i18n.t('pick.obtained_msg', { label, count: pickQty })}`)

  if (remainQty > 0) {
    drop.quantity = remainQty
    Terminal.log(`⚠️ ${i18n.t('pick.partial_pick_warning', { count: remainQty })}`)
  } else {
    context.world.removeDropById(drop.id, player.pos)
  }
}
