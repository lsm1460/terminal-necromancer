import { FULL_VISIBLE_MAP_ID_LIST, MAP_IDS } from '~/consts'
import { CommandFunction, Terminal } from '~/core'
import i18n from '~/i18n'

export const mapCommand: CommandFunction = async (args, context) => {
  const { player, events, map } = context
  const isCheat = context.cheats.isFullMap
  const sceneId = map.currentSceneId

  if (!isCheat) {
    if (!events.isCompleted('got_terminal_map')) {
      Terminal.log(i18n.t('commands.map.no_map'))
      return false
    }

    if (sceneId === MAP_IDS.B4_Waste_Disposal_Area) {
      Terminal.log(i18n.t('commands.map.no_map'))
      return false
    }
  }

  const tiles = map.currentScene.tiles
  if (!tiles) return false

  const isFullyVisible = context.cheats.isFullMap || (FULL_VISIBLE_MAP_ID_LIST as string[]).includes(sceneId)

  Terminal.log(`\n--- 🗺️ ${i18n.t(`scene.${map.currentScene.id}`)} ---`)

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
          if (tile.npcIds && tile.npcIds.includes('vending_machine')) return '🧪'
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
          return '⬜'
        })
        .join('')
    })
    .join('\n')

  Terminal.log(mapDisplay)
  Terminal.log(i18n.t('commands.map.legend_title'))

  const legendItems = i18n.t('commands.map.legend_items', { returnObjects: true }) as string[]
  legendItems.forEach((item) => Terminal.log(item))

  Terminal.log(i18n.t('commands.map.footer'))

  return false
}
