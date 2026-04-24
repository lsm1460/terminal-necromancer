import { EventBus, GameEngine, GameEventType, IAssets, ItemGenerator, Terminal } from '~/core'
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

export interface BootOptions {
  renderer: any
  translator: (info: any) => string
  assets: IAssets
  initState: any
  onExit?: () => void
}

export class GameBootstrapper {
  public engine: GameEngine | null = null
  public eventBus: EventBus
  public saveSystem: SaveSystem
  public configSystem: ConfigSystem
  private isRunning: boolean = false

  constructor(private path?: { statePath?: string; configPath?: string; achievementPath?: string }) {
    this.eventBus = new EventBus()
    this.saveSystem = new SaveSystem(path?.statePath)
    this.configSystem = new ConfigSystem(path?.configPath)
  }

  async run(options: BootOptions): Promise<GameEngine> {
    if (this.isRunning) {
      console.warn('엔진이 이미 실행 중입니다.')
      return this.engine!
    }

    const { renderer, translator, assets, initState, onExit } = options

    const itemFactory = new GameItemFactory()
    const itemGenerator = new ItemGenerator(new ItemPolicy(), itemFactory)
    new Broadcast(this.eventBus)
    new SkillEffectPresenter(this.eventBus)

    Terminal.setRenderer(renderer)
    Terminal.setTranslator(translator)

    const achievement = new AchievementManager(this.eventBus, assets.achievements, this.path?.achievementPath)
    const title = new Title(this.saveSystem, this.configSystem, achievement)

    const playData = await title.gameStart(initState)
    if (!playData) {
      throw new Error('게임 데이터를 불러오지 못했습니다.')
    }

    const player = new Necromancer(itemFactory, assets.level, this.eventBus, playData.player)

    this.engine = new GameEngine(
      assets,
      { renderer, eventBus: this.eventBus, player, itemGenerator },
      {
        saveSystem: this.saveSystem,
        configSystem: this.configSystem,
        skills: { passive: PASSIVE_EFFECTS, specials: SpecialSkillLogics },
        quest: new QuestManager(this.eventBus),
        MapManager,
        NpcManager: NPCManager,
        MonsterEvent,
        commandSystems: [CheatSystem, StatusSystem, ExitSystem, MoveSystem],
      }
    )

    await this.engine.init(playData)
    this.isRunning = true

    const exitSubscription = this.eventBus.subscribe(GameEventType.SYSTEM_EXIT, () => {
      this.isRunning = false
      exitSubscription.unsubscribe()
      if (onExit) onExit()
    })

    return this.engine
  }
}
