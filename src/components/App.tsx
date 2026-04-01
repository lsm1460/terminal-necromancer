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
import { motion } from 'framer-motion'
import { GameProvider } from '~/contexts/GameContext'
import { assetManager } from '~/core/WebAssetManager'
import { useShortcuts } from '~/hooks/useShortcuts'
import { useSwipeShortcuts } from '~/hooks/useSwipeShortcuts'
import { useGameStore } from '~/stores/useGameStore'
import { ConfigScreen } from './ConfigScreen'
import { GameScreen } from './GameScreen'

export const App = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem())

  const isOpenConfigMenu = useGameStore((state) => state.isOpenConfigMenu)

  const [isGameOn, setIsGameOn] = useState(false)

  useShortcuts(engineRef)
  useSwipeShortcuts(engineRef)

  useEffect(() => {
    const initGame = async () => {
      const renderer = new ReactRenderer()
      Terminal.setRenderer(renderer)

      const save = saveSystemRef.current
      const locale = save.load()?.config?.locale || 'ko'

      const playData = await Title.gameStart(save, initState)
      if (playData) {
        await assetManager.loadInitialAssets(assets, locale)

        const engine = new GameEngine(assets, renderer, save)
        engineRef.current = engine

        await engine.init(playData)
        await engine.start()

        setIsGameOn(true)
      }
    }
    initGame()
  }, [])

  return (
    <GameProvider engine={engineRef}>
      <div className="relative h-dvh w-full overflow-hidden bg-grey-800">
        <motion.div
          animate={{ x: isOpenConfigMenu ? '-10%' : 0, opacity: isOpenConfigMenu ? 0.5 : 1 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <GameScreen isGameOn={isGameOn} />
        </motion.div>

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: isOpenConfigMenu ? 0 : '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <ConfigScreen />
        </motion.div>
      </div>
    </GameProvider>
  )
}
