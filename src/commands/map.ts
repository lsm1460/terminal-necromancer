import { MAP_IDS } from '~/consts'
import { CommandFunction } from '~/types'

export const mapCommand: CommandFunction = async (player, args, context) => {
  const { events, map } = context

  if (!events.isCompleted('first_boss')) {
    console.log('📜 지도가 없습니다.')
    return false
  }

  const sceneId = map.currentSceneId

  if (sceneId === MAP_IDS.B4_Waste_Disposal_Area) {
    console.log('📜 지도가 없습니다.')
    return false
  }

  const tiles = map.currentScene.tiles
  if (!tiles) return false

  const isFullyVisible = ([MAP_IDS.B1_SUBWAY, MAP_IDS.B3_5_RESISTANCE_BASE] as string[]).includes(sceneId)

  console.log(`\n--- 🗺️ ${map.currentScene.displayName} ---`)

  const mapDisplay = tiles
    .map((row, y) => {
      return row
        .map((tile, x) => {
          // 1. 타일 데이터 자체가 없는 경우 (빈 공간/벽)
          if (!tile) return '⬛'

          // 2. 미탐사 구역 (구름/안개 처리)
          if (!isFullyVisible && !tile.isSeen) return '☁️ '

          // 3. 플레이어 현재 위치
          if (player.x === x && player.y === y) return '📍'

          // 4. 이벤트/NPC 우선순위
          if (tile.theme === 'vending_machine_area') return '🧪'
          if (tile.event.startsWith('heal')) return '💊'
          if (tile.event === 'boss') return '👹'

          if (tile.npcIds && tile.npcIds.length > 0) {
            if (tile.npcIds.includes('elevator')) return '🛗 '
            if (tile.npcIds.includes('death')) return '💀'
            return '👤 '
          }

          if (tile.event.startsWith('monster') && !tile.isClear) {
            return '⚔️ '
          }

          // 5. 일반 타일 (밝은 상자)
          // 클리어 여부에 따라 아이콘 분리 (· 는 가독성을 위해 상자 안에 점이 있는 느낌)
          return '⬜'
        })
        .join('')
    })
    .join('\n')

  console.log(mapDisplay)
  console.log('\n[ 지도 범례 ]')
  console.log('📍:현재위치 | ☁️ :미탐사 | ⬜:안전한 길 | ⚔️ :전투 필요')
  console.log('👹:보스     | 🛗:승강기   | 💀:죽음       | 👤:NPC')
  console.log('---------------------------------------')

  return false
}
