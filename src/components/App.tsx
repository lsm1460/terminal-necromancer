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
import { assetManager, EventBus, GameEngine, GameEventType, ItemGenerator, Terminal } from '~/core'
import { useShortcuts } from '~/hooks/useShortcuts'
import { ReactRenderer } from '~/renderers/ReactRenderer'
import {
  AchievementManager,
  Broadcast,
  ConfigSystem,
  GameItemFactory,
  ItemPolicy,
  MapManager,
  MonsterEvent,
  Necromancer,
  NPCManager,
  QuestManager,
  SaveSystem,
  Title,
} from '~/systems'
import { CheatSystem, ExitSystem, MoveSystem, StatusSystem } from '~/systems/commands'
import { PASSIVE_EFFECTS, SkillEffectPresenter, SpecialSkillLogics } from '~/systems/skill'
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
    const itemFactory = new GameItemFactory()
    const policy = new ItemPolicy()
    const itemGenerator = new ItemGenerator(policy, itemFactory)

    new Broadcast(eventBus)
    new SkillEffectPresenter(eventBus)

    const renderer = new ReactRenderer()

    const save = saveSystemRef.current
    const config = configSystemRef.current
    Terminal.setRenderer(renderer)
    Terminal.setTranslator((info) => {
      if (typeof info === 'string') return info
      return t(info.key, info.args)
    })

    openWindow()

    const run = async () => {
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

      const player = new Necromancer(itemFactory, assets.level, eventBus, playData?.player)

      const engine = new GameEngine(
        assets,
        {
          renderer,
          eventBus,
          player,
          itemGenerator,
        },
        {
          saveSystem: save,
          configSystem: config,
          skills: {
            passive: PASSIVE_EFFECTS,
            specials: SpecialSkillLogics,
          },
          quest: new QuestManager(eventBus),
          MapManager: MapManager,
          NpcManager: NPCManager,
          MonsterEvent: MonsterEvent,
          commandSystems: [CheatSystem, StatusSystem, ExitSystem, MoveSystem],
        }
      )

      engineRef.current = engine

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
