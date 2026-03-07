import '~/assets/style/App.css'
//
import { useEffect, useRef } from 'react'
import { assets, initState } from '~/assets'
import { Terminal } from '~/core/Terminal'
import { Title } from '~/core/Title'
import { GameEngine } from '~/gameEngine'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { SaveSystem } from '~/systems/SaveSystem'

// 하위 컴포넌트들
import { assetManager } from '~/core/WebAssetManager'
import { useShortcuts } from '~/hooks/useShortcuts'
import { GameInput } from './GameInput'
import { LogWindow } from './LogWindow'
import { StatusBar } from './StatusBar'
import { BattleStage } from './battle/BattleStage'
import { MiniMap } from './MiniMap'

export const App = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem(assets.state))

  useShortcuts(engineRef)

  useEffect(() => {
    const initGame = async () => {
      const renderer = new ReactRenderer()
      Terminal.setRenderer(renderer)

      const engine = new GameEngine(assets, renderer, saveSystemRef.current)
      engineRef.current = engine

      const playData = await Title.gameStart(saveSystemRef.current, initState)
      if (playData) {
        await assetManager.loadInitialAssets()
        await engine.init(playData)
        await engine.start()
      }
    }
    initGame()
  }, [])

  return (
    <div className="h-dvh flex flex-col bg-grey-900 text-primary font-mono">
      <StatusBar />
      <MiniMap engine={engineRef} />
      <LogWindow />
      <BattleStage />

      <GameInput engine={engineRef} />
    </div>
  )
}
