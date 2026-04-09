import { Terminal } from './core/Terminal'
import { World } from './core/World'
import i18n from './i18n'
import { GameContext, PositionType } from './types'

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

export function printTileStatus(context: GameContext) {
  const { player, map, npcs } = context
  const tile = map.getTile(player.pos)

  Terminal.log(`\n` + i18n.t(`tiles.${tile.id}.dialogue`))

  const alive = npcs.getAliveNPCInTile()

  if (alive.length > 0) {
    const list = alive.map((_npc) => {
      const hasQuest = _npc.hasQuest(context)

      return {
        hasQuest,
        name: _npc.name,
      }
    })

    Terminal.say(list)
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

export function printLootStatus({ player, world, map }: GameContext) {
  const tile = map.getTile(player.pos)

  const bag = world.getLootBagAt(map.currentSceneId, tile.id)
  if (bag) Terminal.pick('lootBag', `\n \x1b[31m[!]\x1b[0m ${i18n.t('found_soul')}`)

  printDrops(world, player.pos)
}

export function printDrops(world: World, pos: PositionType) {
  const drops = world.getDropsAt(pos)
  if (drops?.length) {
    Terminal.log(`\n${i18n.t('local_drops')}`)
    drops.forEach((d) => {
      const qtyText = !!d.quantity ? ` x ${d.quantity}` : ''
      const { name, origin } = d

      Terminal.look(` - ${name}${qtyText}`, origin, 'item')
    })
  }
}
