import React, { createContext, ReactNode, useContext } from 'react'
import { GameEngine } from '~/core/gameEngine'

interface GameContextType {
  engine: React.RefObject<GameEngine | null>
}

const GameContext = createContext<GameContextType | null>(null)

export const GameProvider: React.FC<{
  engine: React.RefObject<GameEngine | null>
  children: ReactNode
}> = ({ engine, children }) => {
  return <GameContext.Provider value={{ engine }}>{children}</GameContext.Provider>
}

export const useGameContext = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}
