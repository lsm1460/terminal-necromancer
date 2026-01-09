import { Player } from './core/Player'
import { GameContext, NPC } from './types'

export function printTileStatus(player: Player, { map, npcs, world }: GameContext) {
  const { x, y } = player.pos
  const tile = map.getTile(x, y)

  console.log(`\n${tile.dialogue}`)

  const npcList = (tile.npcIds || []).map((_id) => npcs.getNPC(_id)).filter((npc): npc is NPC => npc !== null)

  const alive = npcList.filter((npc) => npc.isAlive)

  const corpses = world.getCorpsesAt(x, y)

  if (alive.length > 0) {
    const isSingular = alive.length === 1
    const aliveNames = alive.map((_npc) => _npc.name).join(', ')

    console.log(`주변에 있는 사람${isSingular ? '' : '들'}: ${aliveNames}`)
  }

  if (corpses.length > 0) {
    const deadNames = corpses.map((_corpse) => `${_corpse.name}의 시체`).join(', ')

    console.log(`주변의 시체: ${deadNames}`)
  }

  // 이동 가능한 방향 계산
  const directions: string[] = []

  if (map.canMove(x, y - 1)) directions.push('위')
  if (map.canMove(x, y + 1)) directions.push('아래')
  if (map.canMove(x - 1, y)) directions.push('왼쪽')
  if (map.canMove(x + 1, y)) directions.push('오른쪽')

  console.log(`이동 가능 방향: ${directions.join(', ')}`)
}

export function printLootStatus(player: Player, { world }: GameContext) {
  const { x, y } = player.pos
  const bag = world.getLootBagAt(x, y)
  if (bag) console.log(`\n나의 시체를 발견했다.`)

  const drops = world.getDropsAt(x, y)
  if (drops?.length) {
    console.log(`\n주변에 떨어진 아이템:`)
    drops.forEach((d) => {
      const qtyText = !!d.quantity ? ` ${d.quantity}개` : ''
      console.log(` - ${d.label}${qtyText}`)
    })
  }
}

export function printStatus(player: Player, context: GameContext) {
  printTileStatus(player, context)
  printLootStatus(player, context)
}
