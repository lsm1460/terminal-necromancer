import { MAP_IDS } from '~/consts'
import { EventBus, GameEngine, GameEventType, IAssets, ItemGenerator, Renderer, Terminal } from '~/core'
import { LootFactory } from '~/core/LootFactory'
import i18n from '~/i18n'
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
import { CheatSystem, ExitSystem, HelpSystem, MoveSystem, StatusSystem } from '~/systems/commands'
import { PASSIVE_EFFECTS, SkillEffectPresenter, SpecialSkillLogics } from '~/systems/skill'
import { I18nAdapter } from './I18nAdapter'

export interface BootOptions {
  renderer: Renderer
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

  async run(options: BootOptions): Promise<GameEngine | null> {
    if (this.isRunning) {
      console.warn('엔진이 이미 실행 중입니다.')
      return this.engine!
    }

    const { renderer, assets, initState, onExit } = options

    const itemFactory = new GameItemFactory()
    const itemGenerator = new ItemGenerator(new ItemPolicy(), itemFactory)
    new Broadcast(this.eventBus)
    new SkillEffectPresenter(this.eventBus)

    const _renderer = new I18nAdapter(renderer, (key, args) => i18n.t(key, args) as string, i18n.exists)
    Terminal.setRenderer(_renderer)

    const achievement = new AchievementManager(this.eventBus, assets.achievements, this.path?.achievementPath)
    const title = new Title(this.saveSystem, this.configSystem, achievement)

    const playData = await title.gameStart(initState)
    if (!playData) {
      this.isRunning = false

      return null
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
        commandSystems: [CheatSystem, StatusSystem, ExitSystem, MoveSystem, HelpSystem],
      }
    )

    await this.engine.init(playData)
    this.isRunning = true

    this.initPlayerDeath(player, renderer)

    const exitSubscription = this.eventBus.subscribe(GameEventType.SYSTEM_EXIT, () => {
      this.isRunning = false
      if (this.engine) {
        this.engine.cleanup()
        this.engine = null
      }
      this.eventBus.clear()
      exitSubscription.unsubscribe()
      if (onExit) onExit()
    })

    return this.engine
  }

  initPlayerDeath(player: Necromancer, renderer: Renderer) {
    const _context = this.engine!.context || {}
    const { npcs, map, world } = _context

    player.onDeath = () => {
      const hostility = (npcs as NPCManager).getFactionContribution('resistance')
      const isHostile = hostility >= 70

      renderer.print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      renderer.print(`📡 [${i18n.t('broadcast.broadcast_echo')}]`)

      if (isHostile) {
        renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_hostile_1')}"`)
        renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_hostile_2')}"`)
      } else {
        renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_normal_1')}"`)
        renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_normal_2')}"`)
      }

      renderer.print(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      renderer.print(`\n${i18n.t('broadcast.player_death_soul_shattered')}\n`)

      const lootBag = LootFactory.fromPlayer(player, map)
      player.exp -= lootBag.exp
      player.gold -= lootBag.gold
      world.addLootBag(lootBag)

      this.saveSystem.save(_context)
      if (map.currentSceneId !== MAP_IDS.B1_SUBWAY) {
        world.clearFloor()
      }

      map.currentSceneId = MAP_IDS.B1_SUBWAY
      player.x = 0
      player.y = 0
      player.hp = 1
      ;(player as Necromancer).removeMercenaries()

      renderer.printStatus(_context)
    }
  }
}
