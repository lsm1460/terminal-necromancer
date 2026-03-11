import '~/assets/style/App.css'
//
import { useEffect, useRef, useState } from 'react'
import { assets, initState } from '~/assets'
import { Terminal } from '~/core/Terminal'
import { Title } from '~/core/Title'
import { GameEngine } from '~/gameEngine'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { SaveSystem } from '~/systems/SaveSystem'

// 하위 컴포넌트들
import { assetManager } from '~/core/WebAssetManager'
import { useShortcuts } from '~/hooks/useShortcuts'
import { BattleStage } from './battle/BattleStage'
import { ButtonList } from './ButtonList'
import { GameInput } from './GameInput'
import { LogWindow } from './LogWindow'
import { MiniMap } from './MiniMap'
import { StatusBar } from './StatusBar'

export const App = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem(assets.state))

  const [isGameOn, setIsGameOn] = useState(false)

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

        setIsGameOn(true)
      }
    }
    initGame()
  }, [])

  return (
    <div
      className="relative grid h-dvh w-full bg-grey-900 text-primary
        grid-cols-1 grid-rows-[auto_1fr_auto_auto] 
        xl:grid-cols-[1fr_300px] xl:grid-rows-[auto_1fr_auto]
        [grid-template-areas:'status''window''side''input']
        xl:[grid-template-areas:'status_side''window_side''input_side']"
    >
      <StatusBar engine={engineRef} />

      <div className="relative flex flex-col overflow-hidden">
        <BattleStage engine={engineRef} />
        <LogWindow engine={engineRef} />
      </div>

      <div className="[grid-area:side] flex flex-col relative xl:border-l border-primary">
        <MiniMap engine={engineRef} />
        {isGameOn && <ButtonList engine={engineRef} />}
      </div>

      <div className="[grid-area:input]">
        <GameInput engine={engineRef} />
      </div>
    </div>
  )
}
