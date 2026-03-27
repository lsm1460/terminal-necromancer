import { Player } from './core/player/Player'
import { GameContext, NPC } from './types'

import { union } from 'lodash'
import { QuestManager } from './core/QuestManager'
import { Terminal } from './core/Terminal'
import i18n from './i18n'
import { getItemLabel } from './utils'

export function printDirections(player: Player, context: GameContext) {
  const { map } = context
  const { x, y } = player.pos

  const directions: string[] = []

  if (map.canMove(x, y - 1)) directions.push(i18n.t('up'))
  if (map.canMove(x, y + 1)) directions.push(i18n.t('down'))
  if (map.canMove(x - 1, y)) directions.push(i18n.t('left'))
  if (map.canMove(x + 1, y)) directions.push(i18n.t('right'))

  Terminal.move(directions)
}

export function printTileStatus(player: Player, context: GameContext) {
  const { map, npcs, world } = context
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  Terminal.log(`\n` + i18n.t(`tiles.${tile.id}.dialogue`))

  const npcList = union(tile.npcIds || [], player.knight ? ['_knight'] : [])
    .map((_id) => (_id === '_knight' ? player.knight : npcs.getNPC(_id)))
    .filter((npc): npc is NPC => npc !== null)

  const alive = npcList.filter((npc) => npc.isAlive)
  const corpses = world.getCorpsesAt(x, y)

  if (alive.length > 0) {
    const list = alive.map((_npc) => {
      const hasQuest = QuestManager.hasQuest(player, _npc.id, context)

      return {
        hasQuest,
        name: _npc.name,
      }
    })

    Terminal.say(list)
  }

  if (corpses.length > 0) {
    const deadNames = corpses.map((_corpse) => _corpse.name + i18n.t('corpses')).join(', ')

    Terminal.log(i18n.t('local_corpses') + deadNames)
  }

  printLootStatus(player, context)
}

export function printLootStatus(player: Player, { world, map }: GameContext) {
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  const bag = world.getLootBagAt(map.currentSceneId, tile.id)
  if (bag) Terminal.pick('lootBag', `\n \x1b[31m[!]\x1b[0m ${i18n.t('found_soul')}`)

  const drops = world.getDropsAt(x, y)
  if (drops?.length) {
    Terminal.log(`\n${i18n.t('local_drops')}`)
    drops.forEach((d) => {
      const qtyText = !!d.quantity ? ` x ${d.quantity}` : ''
      const { label, origin } = getItemLabel(d)

      Terminal.look(` - ${label}${qtyText}`, origin, 'item')
    })
  }
}

export function printStatus(player: Player, context: GameContext) {
  printTileStatus(player, context)
}
