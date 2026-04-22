import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { CommandFunction, LootBag } from '~/types'
import { GameDrop } from '~/types/item'

export const pickCommand: CommandFunction = async (args, context) => {
  const { player, map, world, currentTile: tile } = context

  const drops = world.getDropsAt<GameDrop>(player.pos)
  const lootBag = world.getLootBagAt(map.currentSceneId, tile.id)
  const availableSpace = getAvailableSpace(player)

  if (!hasPickableItems(drops, lootBag)) return false
  if (!checkInventorySpace(availableSpace, player)) return false

  const [arg] = args

  let drop: GameDrop | undefined

  if (arg) {
    if (arg === 'lootBag' && lootBag) {
      handleLootBagPick(lootBag, context)

      return false
    }

    drop = drops.find((d) => d.origin === arg)

    if (!drop) {
      Terminal.log(i18n.t('item_not_found'))
      return false
    }
  } else {
    const choices = makeDropTargetOptions(drops, player, lootBag)
    const selectionId = await Terminal.select(i18n.t('pick.select_target', { space: availableSpace }), choices)
    if (!selectionId || selectionId === 'cancel') return false

    if (selectionId === 'lootBag' && lootBag) {
      handleLootBagPick(lootBag, context)

      return false
    }

    drop = drops.find((d) => d.id === selectionId)
  }

  if (drop) {
    handleItemPick(drop, availableSpace, context)
  }

  return false
}

function getAvailableSpace(player: Player): number {
  const currentTotal = player.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)
  return player.inventoryMax - currentTotal
}

function hasPickableItems(drops: GameDrop[], lootBag?: LootBag): boolean {
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

const makeDropTargetOptions = (drops: GameDrop[], player: Player, lootBag?: LootBag) => [
  ...(lootBag
    ? [
        {
          name: 'lootBag',
          message: i18n.t('pick.lootbag_choice', { exp: lootBag.exp, gold: lootBag.gold }),
        },
      ]
    : []),
  ...drops.map((d) => ({ name: d.id, message: d.makeItemMessage(player) })),
  { name: 'cancel', message: i18n.t('cancel') },
]

function handleLootBagPick(lootBag: LootBag, context: GameContext) {
  const { player, world } = context
  Terminal.log(`\n${i18n.t('pick.lootbag_recover_msg', { exp: lootBag.exp, gold: lootBag.gold })}`)
  Terminal.log(`"${i18n.t('pick.lootbag_flavor_text')}"`)

  player.gainExp(lootBag.exp)
  player.gainGold(lootBag.gold)
  world.removeLootBag()
}

function handleItemPick(drop: GameDrop, availableSpace: number, context: GameContext) {
  const { player, world } = context

  const totalDropQty = drop.quantity || 1
  const pickQty = Math.min(totalDropQty, availableSpace)
  const remainQty = totalDropQty - pickQty

  drop.quantity = pickQty
  player.addItem(drop)

  Terminal.log(`\n✨ ${i18n.t('pick.obtained_msg', { label: drop.name, count: pickQty })}`)

  if (remainQty > 0) {
    drop.quantity = remainQty
    Terminal.log(`⚠️ ${i18n.t('pick.partial_pick_warning', { count: remainQty })}`)
  } else {
    world.removeDropById(drop.id, player.pos)
  }
}
