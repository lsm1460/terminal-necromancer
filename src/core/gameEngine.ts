import { GameAssets } from '~/assets'
import * as Commands from '~/commands'
import { MAP_IDS } from '~/consts'
import { Battle, BattleComponentFactory } from '~/core/battle'
import { EventBus } from '~/core/EventBus'
import { EventLedger } from '~/core/EventLedger'
import { DropSystem } from '~/core/item/DropSystem'
import { LootFactory } from '~/core/LootFactory'
import { MonsterFactory } from '~/core/MonsterFactory'
import { NpcSkillManager } from '~/core/skill/npcs/NpcSkillManger'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { Broadcast } from '~/systems/Broadcast'
import { ConfigSystem } from '~/systems/ConfigSystem'
import { MonsterEvent } from '~/systems/events/MonsterEvent'
import { GameItemFactory } from '~/systems/item/GameItemFactory'
import { ItemPolicy } from '~/systems/item/ItemPolicy'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { NPCManager } from '~/systems/NpcManager'
import { QuestManager } from '~/systems/QuestManager'
import { SaveData, SaveSystem } from '~/systems/SaveSystem'
import { PASSIVE_EFFECTS } from '~/systems/skill/passiveHandlers'
import { SpecialSkillLogics } from '~/systems/skill/SpecialSkillLogics'
import { CommandManager } from './CommandManager'
import { ItemGenerator } from './item/ItemGenerator'
import { BaseMapManager } from './map/BaseMapManager'
import { MapData } from './map/MapData'
import { BaseNPCManager } from './npc/BaseNPCManager'
import { NPCData } from './npc/NPCData'
import { Player } from './player/Player'
import { printDirections } from './statusPrinter'
import { GameContext, ICommandSystem, IMapManager, INpcManager, Renderer } from './types'

export class GameEngine {
  public context!: GameContext
  public commands: CommandManager = new CommandManager()

  isProcessing = false

  // 생성자에서 받는 assets는 이제 경로가 아닌 실제 JSON 데이터 덩어리입니다.
  constructor(
    private assets: GameAssets,
    private renderer: Renderer,
    private saveSystem: SaveSystem,
    private configSystem: ConfigSystem,
    private eventBus: EventBus,
    private MapManager?: new (data: MapData, eventBus: EventBus) => IMapManager,
    private NpcManager?: new (data: NPCData, eventBus: EventBus) => INpcManager,
    private commandSystems?: (new <T extends GameContext<any>>(context: T) => ICommandSystem)[]
    // npcSkillManager // npc skill이 있다면 위에서 생성하여 주입하자
    // player * 필수
  ) {}

  public async init(initData: SaveData<Necromancer>) {
    const { item, drop, monsterGroup, monster, level, npcSkills, map, npc } = this.assets

    const itemFactory = new GameItemFactory()
    const policy = new ItemPolicy()
    const itemGenerator = new ItemGenerator(policy, itemFactory)

    const dropSystem = new DropSystem(item, drop, itemGenerator)
    const monsterFactory = new MonsterFactory(monsterGroup, monster)

    const eventBus = this.eventBus
    const player = new Necromancer(itemFactory, level, eventBus, initData?.player)
    const mapData = new MapData(map)
    const mapManager: IMapManager = this.MapManager
      ? new this.MapManager(mapData, this.eventBus)
      : new BaseMapManager(mapData)
    const world = new World(itemFactory, player, eventBus)
    const eventLedger = new EventLedger(eventBus, initData?.completedEvents)
    const npcSkillManager = new NpcSkillManager(npcSkills, eventBus)
    npcSkillManager.registerLogics({
      passives: PASSIVE_EFFECTS,
      specials: SpecialSkillLogics,
    })
    const battleFactory = new BattleComponentFactory(player, world, dropSystem, eventBus, npcSkillManager)
    const battle = new Battle(player, monsterFactory, battleFactory)
    const npcData = new NPCData(npc, initData?.npcs)
    const npcs: INpcManager = this.NpcManager
      ? new this.NpcManager(npcData, this.eventBus)
      : new BaseNPCManager(npcData)
    const quest = new QuestManager(eventBus)
    new MonsterEvent(monsterFactory, eventBus, battle, world)
    const broadcastSystem = new Broadcast(npcs, eventBus)

    if (initData?.drop) {
      world.addLootBag(initData.drop)
    }

    this.context = {
      commands: this.commands,
      player,
      map: mapManager,
      world,
      events: eventLedger,
      eventBus,
      npcs,
      drop: dropSystem,
      save: this.saveSystem,
      battle,
      broadcast: broadcastSystem,
      monster: monsterFactory,
      npcSkills: npcSkillManager,
      config: this.configSystem,
      quest,
      cheats: {},

      get currentTile() {
        return this.map.getTile((this.player as Player).pos)!
      },
    } as GameContext

    this.registerCommands()

    player.onDeath = () => {
      const hostility = (npcs as NPCManager).getFactionContribution('resistance')
      const isHostile = hostility >= 70

      this.renderer.print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      this.renderer.print(`📡 [${i18n.t('broadcast.broadcast_echo')}]`)

      if (isHostile) {
        this.renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_hostile_1')}"`)
        this.renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_hostile_2')}"`)
      } else {
        this.renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_normal_1')}"`)
        this.renderer.print(`  📢 "${i18n.t('broadcast.broadcast_player_death_normal_2')}"`)
      }

      this.renderer.print(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      this.renderer.print(`\n${i18n.t('broadcast.player_death_soul_shattered')}\n`)

      const lootBag = LootFactory.fromPlayer(player, mapManager)
      player.exp -= lootBag.exp
      player.gold -= lootBag.gold
      world.addLootBag(lootBag)

      if (mapManager.currentSceneId !== MAP_IDS.B1_SUBWAY) {
        world.clearFloor()
      }

      mapManager.currentSceneId = MAP_IDS.B1_SUBWAY
      player.x = 0
      player.y = 0
      player.hp = 1
      player.removeMercenaries()

      this.renderer.printStatus(this.context)
    }
  }

  public async start(): Promise<void> {
    const { map, currentTile } = this.context
    this.renderer.printStatus(this.context)

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

    if (this.commandSystems) {
      this.commandSystems.forEach((System) => {
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
