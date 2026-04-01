import React, { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Ghost, MapPin, MessageSquareMore, Navigation, Pill, Skull, Swords, User } from 'lucide-react'
import { useGameStore } from '~/stores/useGameStore'
import { useGameMap, TileDisplayType } from '~/hooks/useGameMap'

const TILE_ICONS: Record<TileDisplayType, React.ReactNode> = {
  PLAYER: <MapPin className="w-4 h-4 text-primary" />,
  GHOST: <Ghost className="w-4 h-4 text-primary opacity-50" />,
  VENDING: <FlaskConical className="w-4 h-4 text-primary" />,
  HEAL: <Pill className="w-4 h-4 text-primary" />,
  BOSS: <Skull className="w-4 h-4 text-primary" />,
  QUEST: <MessageSquareMore className="w-4 h-4 text-primary" />,
  ELEVATOR: <Navigation className="w-4 h-4 text-primary rotate-180" />,
  DEATH: <Skull className="w-4 h-4 text-primary" />,
  NPC: <User className="w-4 h-4 text-primary" />,
  MONSTER: <Swords className="w-4 h-4 text-orange-400" />,
  EMPTY: <div className="w-[18px] h-[18px] border border-primary/30 rounded-sm" />,
  NONE: <div className="w-full h-full bg-primary/20" />,
}

export const MiniMap: React.FC = () => {
  const logs = useGameStore((state) => state.logs)
  const { getMapData } = useGameMap()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isXl, setIsXl] = useState(window.innerWidth >= 1280)

  const { map, isMapActive, playerPos } = useMemo(() => getMapData(), [logs, getMapData])

  useEffect(() => {
    const handleResize = () => {
      const isXlNow = window.innerWidth >= 1280
      setIsXl(isXlNow)
      if (isXlNow) setIsExpanded(true)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const TILE_SIZE = 24
  const currentSize = isExpanded ? TILE_SIZE * 11 : TILE_SIZE * 5
  const offset = {
    x: currentSize / 2 - (playerPos?.x || 0) * TILE_SIZE - TILE_SIZE / 2,
    y: currentSize / 2 - (playerPos?.y || 0) * TILE_SIZE - TILE_SIZE / 2,
  }

  if (!isMapActive) return null

  return (
    <div
      onClick={() => !isXl && setIsExpanded(!isExpanded)}
      className="absolute -top-3 right-4 -translate-y-full overflow-hidden border-primary bg-black/50 backdrop-blur-[1.5px] border rounded shadow-2xl z-[1000] transition-all duration-300 xl:relative xl:top-0 xl:right-0 xl:translate-none xl:w-full! xl:h-[300px]!"
      style={{ width: `${currentSize}px`, height: `${currentSize}px`, opacity: isExpanded ? 1 : 0.3 }}
    >
      {!map ? (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
          <span className="font-bold tracking-widest uppercase animate-glitch text-xs">No Signal</span>
        </div>
      ) : (
        <div
          className="absolute transition-all duration-200 flex flex-col xl:transition-none"
          style={{ left: `${offset.x}px`, top: `${offset.y}px` }}
        >
          {map.map((row, y) => (
            <div key={y} className="flex">
              {row.map((tile, x) => (
                <div
                  key={`${x}-${y}`}
                  className="flex items-center justify-center"
                  style={{ width: `${TILE_SIZE}px`, height: `${TILE_SIZE}px` }}
                >
                  {TILE_ICONS[tile?.displayType || 'NONE']}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
