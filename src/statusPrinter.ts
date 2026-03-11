import { Player } from './core/player/Player'
import { GameContext, NPC } from './types'

import { Terminal } from './core/Terminal'
import i18n from './i18n'
import { getItemLabel } from './utils'

export function printTileStatus(player: Player, context: GameContext) {
  const { map, npcs, world } = context
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  Terminal.log(`\n` + i18n.t(`tile.${tile.id}.dialogue`))

  const npcList = (tile.npcIds || []).map((_id) => npcs.getNPC(_id)).filter((npc): npc is NPC => npc !== null)

  const alive = npcList.filter((npc) => npc.isAlive)
  const corpses = world.getCorpsesAt(x, y)

  if (alive.length > 0) {
    const aliveNames = alive.map((_npc) => _npc.name)

    Terminal.say(aliveNames)
  }

  if (corpses.length > 0) {
    const deadNames = corpses.map((_corpse) => `${_corpse.name}의 시체`).join(', ')

    Terminal.log(`주변의 시체: ${deadNames}`)
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
  if (bag) Terminal.log(`\n나의 영혼 파편들을 발견했다.`)

  const drops = world.getDropsAt(x, y)
  if (drops?.length) {
    Terminal.log(`\n주변에 떨어진 아이템:`)
    drops.forEach((d) => {
      const qtyText = !!d.quantity ? ` ${d.quantity}개` : ''
      Terminal.log(` - ${getItemLabel(d)}${qtyText}`)
    })
  }
}

export function printStatus(player: Player, context: GameContext) {
  printTileStatus(player, context)
}
