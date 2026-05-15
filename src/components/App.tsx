import '~/assets/style/App.css'
import { ConfigScreen } from './ConfigScreen'
import { CreditScreen } from './CreditScreen'
import { GameScreen } from './GameScreen'
//
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assetManager, assets, initState } from '~/assets'
import { GameProvider } from '~/contexts/GameContext'
import { GameEngine, Terminal } from '~/core'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { GameBootstrapper } from '~/systems/Bootstrapper'
import { ScreenRouter } from './ScreenRouter'

import { openWindow } from '~/bridge/window'
import { SoundManager } from '~/core/SoundManager'
import { useShortcuts } from '~/hooks/useShortcuts'

export const App = () => {
  const { i18n } = useTranslation()
  const [isGameOn, setIsGameOn] = useState(false)

  const bootstrapperRef = useRef(new GameBootstrapper())
  const engineRef = useRef<GameEngine | null>(null)

  useShortcuts(engineRef)

  useEffect(() => {
    openWindow()

    const runGame = async () => {
      const bootstrapper = bootstrapperRef.current
      const config = bootstrapper.configSystem.load()
      SoundManager.init(assetManager)
      const sm = SoundManager.getInstance()
      sm.setMute(config?.isMute || false)
      sm.setVolume(config?.volume || 0.5)

      try {
        const engine = await bootstrapper.run({
          renderer: new ReactRenderer(),
          assets,
          initState,
          onExit: () => {
            setIsGameOn(false)
            Terminal.clear()
            setTimeout(runGame, 0) // 게임 종료 후 타이틀로 복귀
          },
        })

        if (!engine) {
          return
        }

        engineRef.current = engine

        const locale = bootstrapper.configSystem.locale
        const sceneData = engine.context.map.currentScene
        await assetManager.loadInitialAssets(sceneData, locale)

        await engine.start()
        setIsGameOn(true)
      } catch (error) {
        console.error('Game Start Error:', error)
      }
    }

    runGame()
  }, [i18n])

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
