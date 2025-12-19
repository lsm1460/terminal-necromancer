import { Player } from './core/Player'
import { MapManager } from './core/MapManager'
import { World } from './core/World'

export function printTileStatus(player: Player, map: MapManager) {
  const { x, y } = player.pos
  const tile = map.tile(x, y)
  
  console.log(tile.dialogue)

  // 이동 가능한 방향 계산
  const directions: string[] = []

  if (map.canMove(x, y - 1)) directions.push('위')
  if (map.canMove(x, y + 1)) directions.push('아래')
  if (map.canMove(x - 1, y)) directions.push('왼쪽')
  if (map.canMove(x + 1, y)) directions.push('오른쪽')

  console.log(`이동 가능 방향: ${directions.join(', ')}`)
}

export function printLootStatus(player: Player, world: World) {
  const { x, y } = player.pos
  const bag = world.getLootBagAt(x, y)
  if (bag) console.log(`\n나의 시체를 발견했다.`)

  const drops = world.getDropsAt(x, y)
  if (drops?.length) {
    console.log(`\n주변에 떨어진 아이템:`)
    drops.forEach(d => {
      const qtyText = !!d.quantity ? ` ${d.quantity}개` : ''
      console.log(` - ${d.label}${qtyText}`)
    })
  }
}

export function printStatus(player: Player, map: MapManager, world: World) {
  printTileStatus(player, map)
  printLootStatus(player, world)
}
