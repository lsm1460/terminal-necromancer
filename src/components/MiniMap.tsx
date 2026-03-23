import { FlaskConical, Ghost, MapPin, Navigation, Pill, Skull, Swords, User, MessageSquareMore } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { FULL_VISIBLE_MAP_ID_LIST, MAP_IDS } from '~/consts'
import { QuestManager } from '~/core/QuestManager'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { Tile } from '~/types'

export const MiniMap: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const logs = useGameStore((state) => state.logs)

  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
  const [isMapActive, isSetMapActive] = useState(false)
  const [map, setMap] = useState<(Tile & { hasQuest: boolean })[][] | null>(null)
  const [isFullyVisible, setIsFullyVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isXl, setIsXl] = useState(window.innerWidth >= 1280)

  useEffect(() => {
    const handleResize = () => {
      const isXlNow = window.innerWidth >= 1280
      setIsXl(isXlNow)
      if (isXlNow) {
        setIsExpanded(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // 초기 실행

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const TILE_SIZE = 24
  const MINI_SIZE = TILE_SIZE * 5 // 120px
  const EXPANDED_SIZE = TILE_SIZE * 11 // 264px

  useEffect(() => {
    const _engine = engine.current

    if (_engine && _engine.player && _engine.context) {
      const player = _engine.player
      setPlayerPos({ ...player.pos })

      const { map, events, cheats } = _engine.context
      const isCheat = cheats.isFullMap

      if (isCheat || events.isCompleted('got_terminal_map')) {
        isSetMapActive(true)
      }

      const sceneId = map.currentSceneId

      if (!isCheat && sceneId === MAP_IDS.B4_Waste_Disposal_Area) {
        setMap(null)
        return
      }

      const _isFullyVisible = isCheat || (FULL_VISIBLE_MAP_ID_LIST as string[]).includes(sceneId)

      setIsFullyVisible(_isFullyVisible)
      
      const tiles = map.currentScene.tiles.map((row) =>
        row.map((tile) =>
          tile
            ? {
                ...tile,
                hasQuest: (tile.npcIds || []).some((id) => {
                  const flag = QuestManager.hasQuest(player, id, _engine.context)

                  return flag
                }),
              }
            : tile
        )
      )
      setMap(tiles)
    }
  }, [logs, engine])

  const currentSize = isExpanded ? EXPANDED_SIZE : MINI_SIZE
  const offset = {
    x: currentSize / 2 - playerPos.x * TILE_SIZE - TILE_SIZE / 2,
    y: currentSize / 2 - playerPos.y * TILE_SIZE - TILE_SIZE / 2,
  }

  // 타일 렌더링 로직
  const renderTileContent = (tile: Tile & { hasQuest: boolean }, x: number, y: number) => {
    if (!tile) return <div className="w-full h-full bg-primary/20" />

    const isPlayer = playerPos.x === x && playerPos.y === y
    const isVisible = isFullyVisible || tile.isSeen

    if (isPlayer) return <MapPin className="w-4 h-4 text-primary" />
    if (!isVisible) return <Ghost className="w-4 h-4 text-primary opacity-50" />

    // 이벤트 아이콘 로직
    if (tile.theme === 'vending_machine_area') return <FlaskConical className="w-4 h-4 text-primary" />
    if (tile.event?.startsWith('heal')) return <Pill className="w-4 h-4 text-primary" />
    if (tile.event === 'boss') return <Skull className="w-4 h-4 text-primary" />

    if (tile.npcIds && tile.npcIds.length > 0) {
      if (tile.hasQuest) return <MessageSquareMore className="w-4 h-4 text-primary" />

      if (tile.npcIds.includes('elevator')) return <Navigation className="w-4 h-4 text-primary rotate-180" />
      if (tile.npcIds.includes('death')) return <Skull className="w-4 h-4 text-primary" />

      return <User className="w-4 h-4 text-primary" />
    }

    if (tile.event?.startsWith('monster') && !tile.isClear) return <Swords className="w-4 h-4 text-orange-400" />

    // 아무 이벤트도 없는 일반 타일
    return <div className="w-[18px] h-[18px] border border-primary/30 rounded-sm" />
  }

  if (!isMapActive) {
    return <></>
  }

  return (
    <div
      onClick={() => !isXl && setIsExpanded(!isExpanded)}
      className="absolute top-2 right-4 -translate-y-full overflow-hidden border-primary 
      bg-black/50 backdrop-blur-[1.5px] border rounded shadow-2xl cursor-pointer 
      z-[1000] transition-all duration-300 ease-in-out
      xl:relative xl:top-0 xl:right-0 xl:translate-none xl:border-x-0 xl:border-t-0 xl:rounded-none xl:w-full! xl:h-[300px]! xl:transition-none
      xl:opacity-100!
      "
      style={{
        width: `${currentSize}px`,
        height: `${currentSize}px`,
        opacity: isExpanded ? 1 : 0.3,
      }}
    >
      {!map ? (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 relative overflow-hidden">
          <span className="font-bold tracking-widest uppercase animate-glitch text-xs xl:text-sm">No Signal</span>
        </div>
      ) : (
        <div
          className="absolute transition-all duration-200 ease-out flex flex-col xl:transition-none"
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
                  className="flex items-center justify-center"
                  style={{ width: `${TILE_SIZE}px`, height: `${TILE_SIZE}px` }}
                >
                  {renderTileContent(tile, x, y)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
