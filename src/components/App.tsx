import '~/assets/style/App.css'
// 하위 컴포넌트들
import { ConfigScreen } from './ConfigScreen'
import { GameScreen } from './GameScreen'
//
import { useEffect, useRef, useState } from 'react'
import { assets, initState } from '~/assets'
import { openWindow } from '~/bridge/window'
import { GameProvider } from '~/contexts/GameContext'
import { Terminal } from '~/core/Terminal'
import { Title } from '~/core/Title'
import { assetManager } from '~/core/WebAssetManager'
import { GameEngine } from '~/gameEngine'
import { useShortcuts } from '~/hooks/useShortcuts'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { ConfigSystem } from '~/systems/ConfigSystem'
import { EventBus } from '~/systems/EventBus'
import { SaveSystem } from '~/systems/SaveSystem'
import { GameEventType } from '~/types/event'
import { CreditScreen } from './CreditScreen'
import { ScreenRouter } from './ScreenRouter'

export const App = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem())
  const configSystemRef = useRef(new ConfigSystem())

  const [isGameOn, setIsGameOn] = useState(false)

  useShortcuts(engineRef)

  useEffect(() => {
    const renderer = new ReactRenderer()
    const save = saveSystemRef.current
    const config = configSystemRef.current
    Terminal.setRenderer(renderer)

    openWindow()

    const run = async () => {
      const eventBus = new EventBus()
      const engine = new GameEngine(assets, renderer, save, config, eventBus)
      engineRef.current = engine

      const playData = await Title.gameStart(save, config, initState)

      if (playData === null) {
        //TODO: exit game
        setIsGameOn(false)
        return
      }

      if (!playData) {
        console.error('게임 데이터를 불러오지 못했습니다.')
        return
      }

      const _config = config.load()
      const locale = _config?.locale || 'ko'

      await engine.init(playData)
      const sceneData = engine.context.map.currentScene

      await assetManager.loadInitialAssets(sceneData, locale)
      await engine.start()

      setIsGameOn(true)

      const exitWait = new Promise<void>((resolve) => {
        eventBus.subscribe(GameEventType.SYSTEM_EXIT, () => {
          resolve()
        })
      })

      await exitWait

      setIsGameOn(false)
      Terminal.clear()

      setTimeout(run, 0)
    }

    run()
  }, [])

  return (
    <GameProvider engine={engineRef}>
      <div className="relative h-dvh w-full overflow-hidden bg-black">
        <ScreenRouter>
          <GameScreen isGameOn={isGameOn} />
          <ConfigScreen />
          <CreditScreen />
        </ScreenRouter>
      </div>
    </GameProvider>
  )
}
