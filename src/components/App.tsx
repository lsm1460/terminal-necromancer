import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assets, initState } from '~/assets'
import { GameProvider } from '~/contexts/GameContext'
import { assetManager, GameEngine, Terminal } from '~/core'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { GameBootstrapper } from '~/systems/Bootstrapper'
import { ConfigScreen } from './ConfigScreen'
import { CreditScreen } from './CreditScreen'
import { GameScreen } from './GameScreen'
import { ScreenRouter } from './ScreenRouter'

export const App = () => {
  const { i18n } = useTranslation()
  const [isGameOn, setIsGameOn] = useState(false)

  // 부트스트래퍼 인스턴스를 유지 (새로고침 전까지 보존)
  const bootstrapperRef = useRef(new GameBootstrapper())
  const engineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    const runGame = async () => {
      const bootstrapper = bootstrapperRef.current

      try {
        const engine = await bootstrapper.run({
          renderer: new ReactRenderer(),
          translator: (info) => (typeof info === 'string' ? info : (i18n.t(info.key, info.args) as string)),
          assets,
          initState,
          onExit: () => {
            setIsGameOn(false)
            Terminal.clear()
            setTimeout(runGame, 0) // 게임 종료 후 타이틀로 복귀
          },
        })

        engineRef.current = engine

        const locale = bootstrapper.configSystem.load()?.locale || 'ko'
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
