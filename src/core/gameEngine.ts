import * as Commands from '~/commands'
import { Battle, BattleComponentFactory } from '~/core/battle'
import { EventBus } from '~/core/EventBus'
import { EventLedger } from '~/core/EventLedger'
import { DropSystem } from '~/core/item/DropSystem'
import { MonsterFactory } from '~/core/MonsterFactory'
import { NpcSkillManager } from '~/core/skill/npcs/NpcSkillManger'
import { World } from '~/core/World'
import { SaveData } from '~/systems/SaveSystem'
import { CommandManager } from './CommandManager'
import { ItemGenerator } from './item/ItemGenerator'
import { BaseMapManager } from './map/BaseMapManager'
import { MapData } from './map/MapData'
import { BaseNPCManager } from './npc/BaseNPCManager'
import { NPCData } from './npc/NPCData'
import { Player } from './player/Player'
import { printDirections } from './statusPrinter'
import {
  GameContext,
  IAssets,
  ICommandSystem,
  IConfigSystem,
  IMapManager,
  IMonsterEvent,
  INpcManager,
  IQuestManager,
  ISaveSystem,
  PassiveDefinition,
  Renderer,
  SpecialSkillLogic,
} from './types'

type InstallContext = Partial<GameContext> & {eventBus: EventBus, monster: MonsterFactory, battle: Battle, world: World}

interface RequiredEngineDependencies {
  renderer: Renderer
  eventBus: EventBus
  player: Player
  itemGenerator: ItemGenerator
}

interface OptionalEngineDependencies {
  saveSystem?: ISaveSystem
  configSystem?: IConfigSystem
  skills?: {
    passive?: Record<string, PassiveDefinition>
    specials?: Record<string, SpecialSkillLogic>
  }
  quest?: IQuestManager
  MapManager?: new (data: MapData, eventBus: EventBus) => IMapManager
  NpcManager?: new (data: NPCData, eventBus: EventBus) => INpcManager
  commandSystems?: (new <T extends GameContext<any>>(context: T) => ICommandSystem)[]
  MonsterEvent?: new (monsterFactory: MonsterFactory, eventBus: EventBus, battle: Battle, world: World) => IMonsterEvent
}

export class GameEngine {
  public context!: GameContext
  public commands: CommandManager

  private isProcessing = false

  // 생성자에서 받는 assets는 이제 경로가 아닌 실제 JSON 데이터 덩어리입니다.
  constructor(
    private assets: IAssets,
    private reqDependencies: RequiredEngineDependencies,
    private optDependencies?: OptionalEngineDependencies
  ) {
    this.commands = new CommandManager(optDependencies?.quest)
  }

  get renderer() {
    return this.reqDependencies.renderer
  }

  public async init(initData: SaveData) {
    const { item, drop, monsterGroup, monster, npcSkills } = this.assets

    const eventBus = this.reqDependencies.eventBus
    const player = this.reqDependencies.player
    const itemGenerator = this.reqDependencies.itemGenerator
    const itemFactory = itemGenerator.itemFactory

    const dropSystem = new DropSystem(item, drop, itemGenerator)
    const world = new World(itemFactory, player, eventBus)
    const monsterFactory = new MonsterFactory(monsterGroup, monster)

    const eventLedger = new EventLedger(eventBus, initData?.completedEvents)
    const npcSkillManager = new NpcSkillManager(npcSkills, eventBus)
    const battleFactory = new BattleComponentFactory(player, world, dropSystem, eventBus, npcSkillManager)
    const battle = new Battle(player, monsterFactory, battleFactory)

    if (initData?.drop) {
      world.addLootBag(initData.drop)
    }

    const context = {
      commands: this.commands,
      player,
      world,
      events: eventLedger,
      eventBus,
      drop: dropSystem,
      battle,
      monster: monsterFactory,
      npcSkills: npcSkillManager,
      cheats: {},
      get currentTile() {
        return (this as any).map.getTile((this.player as Player).pos)!
      },
    } as InstallContext

    this.installOptionalDependencies(context, initData)

    this.registerCommands()

    this.context = context as GameContext
  }

  private installOptionalDependencies = (context: InstallContext, initData: SaveData) => {
    const { map, npc } = this.assets
    const { eventBus, monster, world, battle } = context

    const mapData = new MapData(map)
    context.map = this.optDependencies?.MapManager
      ? new this.optDependencies.MapManager(mapData, eventBus)
      : new BaseMapManager(mapData)

    const npcData = new NPCData(npc, initData?.npcs)
    context.npcs = this.optDependencies?.NpcManager
      ? new this.optDependencies.NpcManager(npcData, eventBus)
      : new BaseNPCManager(npcData)

    if (this.optDependencies?.saveSystem) context.save = this.optDependencies.saveSystem
    if (this.optDependencies?.configSystem) context.config = this.optDependencies.configSystem 

    if (this.optDependencies?.MonsterEvent) {
      new this.optDependencies.MonsterEvent(monster, eventBus, battle, world)
    }
  }

  public async start(): Promise<void> {
    const { map, currentTile } = this.context
    this.reqDependencies.renderer.printStatus(this.context)

    await map.handleTileEvent(currentTile, this.context)

    printDirections(this.context)
  }

  private registerCommands() {
    const handler = this.commands

    // 기본 명령어 등록
    handler.register('up', Commands.moveCommand('up'))
    handler.register('down', Commands.moveCommand('down'))
    handler.register('left', Commands.moveCommand('left'))
    handler.register('right', Commands.moveCommand('right'))
    handler.register('attack', Commands.attackCommand)
    handler.register('equip', Commands.equipCommand)
    handler.register('pick', Commands.pickCommand)
    handler.register('drop', Commands.dropCommand)
    handler.register('help', Commands.helpCommand)
    handler.register('inventory', Commands.inventoryCommand)
    handler.register('clear', Commands.clearCommand)
    handler.register('use', Commands.useCommand)
    handler.register('map', Commands.mapCommand)
    handler.register('talk', Commands.talkCommand)
    handler.register('skill', Commands.skillCommand)
    //
    handler.register('exit', Commands.exitCommand)
    handler.register('look', Commands.lookCommand)
    handler.register('status', Commands.statusCommand)

    // override..
    if (this.optDependencies?.commandSystems) {
      this.optDependencies.commandSystems.forEach((System) => {
        const _system = new System(this.context)
        _system.install(this.commands)
      })
    }
  }

  public async processCommand(
    command: string,
    options?: {
      onBeforeExecute?: () => void
    }
  ): Promise<void> {
    if (this.isProcessing) return

    options?.onBeforeExecute?.()

    this.isProcessing = true
    try {
      await this.commands.handle(command, this.context)
    } finally {
      this.isProcessing = false
    }
  }
}
