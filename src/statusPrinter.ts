import { Player } from './core/player/Player'
import { GameContext, NPC } from './types'

import { Terminal } from './core/Terminal'
import i18n from './i18n'
import { getItemLabel } from './utils'
import { QuestManager } from './core/QuestManager'

export function printTileStatus(player: Player, context: GameContext) {
  const { map, npcs, world } = context
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  Terminal.log(`\n` + i18n.t(`tiles.${tile.id}.dialogue`))

  const npcList = (tile.npcIds || []).map((_id) => npcs.getNPC(_id)).filter((npc): npc is NPC => npc !== null)

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

  // 이동 가능한 방향 계산
  const directions: string[] = []

  if (map.canMove(x, y - 1)) directions.push(i18n.t('up'))
  if (map.canMove(x, y + 1)) directions.push(i18n.t('down'))
  if (map.canMove(x - 1, y)) directions.push(i18n.t('left'))
  if (map.canMove(x + 1, y)) directions.push(i18n.t('right'))

  Terminal.log(i18n.t('paths_ahead') + directions.join(', '))
}

export function printLootStatus(player: Player, { world, map }: GameContext) {
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  const bag = world.getLootBagAt(map.currentSceneId, tile.id)
  if (bag) Terminal.log(`\n \x1b[31m[!]\x1b[0m ${i18n.t('found_soul')}`)

  const drops = world.getDropsAt(x, y)
  if (drops?.length) {
    Terminal.log(`\n${i18n.t('local_drops')}`)
    drops.forEach((d) => {
      const qtyText = !!d.quantity ? ` x ${d.quantity}` : ''
      Terminal.log(` - ${getItemLabel(d)}${qtyText}`)
    })
  }
}

export function printStatus(player: Player, context: GameContext) {
  printTileStatus(player, context)
}
