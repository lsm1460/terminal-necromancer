import { Terminal } from '~/core'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { Player } from './player/Player'
import { GameContext, IMapManager, INpcManager, PositionType, Tile } from './types'

export function printDirections(context: GameContext) {
  const { player, map } = context
  const { x, y } = player.pos

  const directions: string[] = []

  if (map.canMove({ x, y: y - 1 })) directions.push(i18n.t('up'))
  if (map.canMove({ x, y: y + 1 })) directions.push(i18n.t('down'))
  if (map.canMove({ x: x - 1, y })) directions.push(i18n.t('left'))
  if (map.canMove({ x: x + 1, y })) directions.push(i18n.t('right'))

  Terminal.move(directions)
}

interface TileStatusRequired extends LootStatusRequired {
  npcs: INpcManager
}

export function printTileStatus(context: TileStatusRequired) {
  const { player, npcs, currentTile: tile } = context

  Terminal.log('')
  Terminal.log({ key: `tiles.${tile.id}.dialogue` })

  const alive = npcs.getAliveNPCInTile({ tile })

  if (alive.length > 0) {
    const list = alive.map((_npc) => {
      const hasQuest = _npc.hasQuest(context)

      return {
        hasQuest,
        name: _npc.name,
      }
    })

    Terminal.availableTalks(list)
  }

  printCorpses(context.world, player.pos)

  printLootStatus(context)
}

export function printCorpses(world: World, pos: PositionType) {
  const corpses = world.getCorpsesAt(pos)

  if (corpses.length > 0) {
    const deadNames = corpses.map((_corpse) => _corpse.name + i18n.t('corpses')).join(', ')

    Terminal.skill(deadNames, i18n.t('local_corpses'))
  }
}

interface LootStatusRequired {
  player: Player
  world: World
  map: IMapManager
  currentTile: Tile
}

export function printLootStatus({
  player,
  world,
  map,
  currentTile,
}: LootStatusRequired) {
  const bag = world.getLootBagAt(map.currentSceneId, currentTile.id)
  if (bag) Terminal.pick('lootBag', `\n \x1b[31m[!]\x1b[0m ${i18n.t('found_soul')}`)

  printDrops(world, player.pos)
}

export function printDrops(world: World, pos: PositionType) {
  const drops = world.getDropsAt(pos)
  if (drops?.length) {
    Terminal.log({ key: 'local_drops' })
    drops.forEach((d) => {
      const qtyText = !!d.quantity ? ` x ${d.quantity}` : ''
      const { name, origin } = d

      Terminal.look(` - ${name}${qtyText}`, origin, 'item')
    })
  }
}
