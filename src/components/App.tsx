import { useEffect, useRef } from 'react'
import { assets, initState } from '~/assets'
import { Terminal } from '~/core/Terminal'
import { Title } from '~/core/Title'
import { GameEngine } from '~/gameEngine'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { SaveSystem } from '~/systems/SaveSystem'

// 하위 컴포넌트들
import { LogWindow } from './LogWindow'
import { StatusBar } from './StatusBar'
import { GameInput } from './GameInput'

export const App = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem(assets.state))

  useEffect(() => {
    const initGame = async () => {
      const renderer = new ReactRenderer()
      Terminal.setRenderer(renderer)

      const engine = new GameEngine(assets, renderer, saveSystemRef.current)
      engineRef.current = engine

      const playData = await Title.gameStart(saveSystemRef.current, initState)
      if (playData) {
        await engine.init(playData)
        await engine.start()
      }
    }
    initGame()
  }, [])

  return (
    <div className="terminal-container">
      <StatusBar />
      <LogWindow />

      <GameInput engine={engineRef}/>
    </div>
  )
}