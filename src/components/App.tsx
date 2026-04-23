import '~/assets/style/App.css'
// 하위 컴포넌트들
import { ConfigScreen } from './ConfigScreen'
import { CreditScreen } from './CreditScreen'
import { GameScreen } from './GameScreen'
//
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assets, initState } from '~/assets'
import { openWindow } from '~/bridge/window'
import { GameProvider } from '~/contexts/GameContext'
import { EventBus } from '~/core/EventBus'
import { Terminal } from '~/core/Terminal'
import { Title } from '~/core/Title'
import { assetManager } from '~/core/WebAssetManager'
import { GameEngine } from '~/core/gameEngine'
import { GameEventType } from '~/core/types'
import { useShortcuts } from '~/hooks/useShortcuts'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import { AchievementManager } from '~/systems/AchievementManager'
import { ConfigSystem } from '~/systems/ConfigSystem'
import { MapManager } from '~/systems/MapManager'
import { NPCManager } from '~/systems/NpcManager'
import { SaveSystem } from '~/systems/SaveSystem'
import { CheatSystem } from '~/systems/commands/CheatSystem'
import { SkillEffectPresenter } from '~/systems/presenter/SkillEffectPresenter'
import { ScreenRouter } from './ScreenRouter'

export const App = () => {
  const engineRef = useRef<GameEngine | null>(null)
  const saveSystemRef = useRef(new SaveSystem())
  const configSystemRef = useRef(new ConfigSystem())

  const { t } = useTranslation()

  const [isGameOn, setIsGameOn] = useState(false)

  useShortcuts(engineRef)

  useEffect(() => {
    const eventBus = new EventBus()

    const renderer = new ReactRenderer()
    new SkillEffectPresenter(eventBus)

    const save = saveSystemRef.current
    const config = configSystemRef.current
    Terminal.setRenderer(renderer)
    Terminal.setTranslator((info) => {
      if (typeof info === 'string') return info
      return t(info.key, info.args)
    })

    openWindow()

    const run = async () => {
      const engine = new GameEngine(assets, renderer, save, config, eventBus, MapManager, NPCManager, [CheatSystem])
      engineRef.current = engine

      const achievement = new AchievementManager(eventBus, assets.achievements)

      const title = new Title(save, config, achievement)
      const playData = await title.gameStart(initState)

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
