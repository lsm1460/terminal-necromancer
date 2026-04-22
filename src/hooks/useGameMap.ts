import { useCallback } from 'react'
import { FULL_VISIBLE_MAP_ID_LIST, MAP_IDS } from '~/consts'
import { Tile } from '~/core/types'
import { useGame } from './useGame'

// 타일의 시각적 상태를 정의하는 유니온 타입
export type TileDisplayType =
  | 'PLAYER'
  | 'GHOST'
  | 'VENDING'
  | 'HEAL'
  | 'BOSS'
  | 'QUEST'
  | 'ELEVATOR'
  | 'DEATH'
  | 'NPC'
  | 'MONSTER'
  | 'EMPTY'
  | 'NONE'

export const useGameMap = () => {
  const { getPlayer, getContext } = useGame()

  const getTileDisplayType = (tile: Tile | null, isPlayer: boolean, isFullyVisible: boolean): TileDisplayType => {
    if (!tile) return 'NONE'
    if (isPlayer) return 'PLAYER'

    const isVisible = isFullyVisible || tile.isSeen
    if (!isVisible) return 'GHOST'

    // 이벤트 우선순위 판단 로직 (비즈니스 규칙)
    if (tile.npcIds && tile.npcIds.includes('vending_machine')) return 'VENDING'
    if (tile.event?.startsWith('heal')) return 'HEAL'
    if (tile.event === 'boss') return 'BOSS'

    if (tile.npcIds && tile.npcIds.length > 0) {
      // @ts-ignore (tile에 가공된 hasQuest가 있다고 가정)
      if (tile.hasQuest) return 'QUEST'
      if (tile.npcIds.includes('elevator')) return 'ELEVATOR'
      if (tile.npcIds.includes('death')) return 'DEATH'
      return 'NPC'
    }

    if (tile.event?.startsWith('monster') && !tile.isClear) return 'MONSTER'

    return 'EMPTY'
  }

  const getMapData = useCallback(() => {
    const player = getPlayer()
    const context = getContext()
    if (!player || !context) return { map: null, isMapActive: false }

    const { map, events, cheats, npcs } = context
    const sceneId = map.currentSceneId
    const isCheat = cheats.isFullMap

    const isMapActive = isCheat || events.isCompleted('got_terminal_map')
    if (!isCheat && sceneId === MAP_IDS.B4_Waste_Disposal_Area) {
      return { map: null, isMapActive, isFullyVisible: false }
    }

    const isFullyVisible = isCheat || (FULL_VISIBLE_MAP_ID_LIST as string[]).includes(sceneId)

    const processedTiles = map.currentScene.tiles.map((row, y) =>
      row.map((tile, x) => {
        if (!tile) return null

        const isPlayer = player.pos.x === x && player.pos.y === y

        // 1. 퀘스트 여부 판단
        const hasQuest = (tile.npcIds || []).some((id) => {
          const npc = npcs.getNPC(id)
          return npc ? npc.hasQuest(context) : false
        })

        const tileWithQuest = { ...tile, hasQuest }

        // 2. 최종 디스플레이 타입 결정
        return {
          ...tileWithQuest,
          displayType: getTileDisplayType(tileWithQuest, isPlayer, isFullyVisible),
        }
      })
    )

    return {
      map: processedTiles,
      isMapActive,
      isFullyVisible,
      playerPos: player.pos,
    }
  }, [getPlayer, getContext])

  return { getMapData }
}
