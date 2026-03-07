import React, { useEffect, useState, useMemo } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { Tile } from '~/types'

export const MiniMap: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const logs = useGameStore((state) => state.logs)

  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
  const [map, setMap] = useState<Tile[][]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const TILE_SIZE = 24
  const MINI_SIZE = TILE_SIZE * 5 // 120px
  const EXPANDED_SIZE = TILE_SIZE * 11 // 264px

  useEffect(() => {
    const _engine = engine.current

    if (_engine && _engine.player && _engine.context) {
      const player = _engine.player
      setPlayerPos({ ...player.pos })

      const tiles = _engine.context.map.currentScene.tiles
      setMap([...tiles])
    }
  }, [logs, engine])

  const currentSize = isExpanded ? EXPANDED_SIZE : MINI_SIZE
  const offset = {
    x: currentSize / 2 - playerPos.x * TILE_SIZE - TILE_SIZE / 2,
    y: currentSize / 2 - playerPos.y * TILE_SIZE - TILE_SIZE / 2,
  }

  // 타일 렌더링 로직
  const renderTileContent = (tile: Tile, x: number, y: number) => {
    if (playerPos.x === x && playerPos.y === y) return '📍'
    if (!tile?.isSeen) return '☁️'

    if (tile.theme === 'vending_machine_area') return '🧪'
    if (tile.event?.startsWith('heal')) return '💊'
    if (tile.event === 'boss') return '👹'

    if (tile.npcIds && tile.npcIds.length > 0) {
      if (tile.npcIds.includes('elevator')) return '🛗'
      if (tile.npcIds.includes('death')) return '💀'
      return '👤'
    }

    if (tile.event?.startsWith('monster') && !tile.isClear) return '⚔️'

    return '⬜'
  }

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="fixed top-5 right-5 overflow-hidden bg-black/90 border-2 border-zinc-700 rounded shadow-2xl cursor-pointer z-[1000] transition-all duration-300 ease-in-out"
      style={{
        width: `${currentSize}px`,
        height: `${currentSize}px`,
      }}
    >
      {/* 맵 레이어 */}
      <div
        className="absolute transition-all duration-200 ease-out flex flex-col"
        style={{
          left: `${offset.x}px`,
          top: `${offset.y}px`,
        }}
      >
        {map.map((row, y) => (
          <div key={y} className="flex">
            {row.map((tile, x) => (
              <div
                key={`${x}-${y}`}
                className="flex items-center justify-center text-[14px]"
                style={{ width: `${TILE_SIZE}px`, height: `${TILE_SIZE}px` }}
              >
                {renderTileContent(tile, x, y)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
