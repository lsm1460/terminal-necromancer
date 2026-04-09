import _ from 'lodash'
import i18n from '~/i18n'
import { GameContext, NPC, Tile } from '~/types'

// NPC 인스턴스가 아닌 서비스 레벨에서 상태 관리 (필요 시 세이브 데이터와 연동)
let encounterCount = 0
let answers = { first: null as boolean | null, second: null as boolean | null }

export const CaronService = {
  getEncounterCount: () => encounterCount,
  incrementCount: () => encounterCount++,
  saveAnswer: (key: 'first' | 'second', value: boolean) => (answers[key] = value),
  getAnswers: () => answers,

  /** 카론 위치 재배치 로직 */
  relocate(npc: NPC, context: GameContext) {
    const { player, map } = context
    const tiles: (Tile | null)[][] = map.currentScene.tiles

    // 1. 현재 타일 이벤트 제거
    const currentTile = map.getTile(player.pos)
    if (currentTile) currentTile.event = 'none'

    // 2. 전체 타일 초기화
    tiles.forEach((row) => {
      row?.forEach((tile) => {
        if (tile) {
          tile.npcIds = _.without(tile.npcIds, 'caron')
          tile.observe = i18n.t('npc.caron.relocate.default_observe')
        }
      })
    })

    // 3. 새 후보지 추출 및 이동
    const candidates: { x: number; y: number; tile: Tile }[] = []
    tiles.forEach((row, y) => {
      row?.forEach((tile, x) => {
        if (tile && tile.event === 'event-caron') candidates.push({ x, y, tile })
      })
    })

    const target = _.sample(candidates)
    if (target) {
      const { x, y, tile } = target
      if (!tile.npcIds) tile.npcIds = []
      tile.npcIds.push(npc.id)

      // 인접 타일 힌트 설정
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ]
      directions.forEach((dir) => {
        const neighbor = tiles[y + dir.dy]?.[x + dir.dx]
        if (neighbor) neighbor.observe = i18n.t('npc.caron.relocate.proximity_hint')
      })
    }
  },
}
