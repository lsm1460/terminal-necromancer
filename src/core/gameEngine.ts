import { GameAssets } from '~/assets'
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
import { Renderer } from '~/types'
import { handleCommand } from './commandHandler'
import { ItemGenerator } from './item/ItemGenerator'
import { BaseMapManager } from './map/BaseMapManager'
import { MapData } from './map/MapData'
import { printDirections } from './statusPrinter'
import { GameContext, IMapManager } from './types'

export class GameEngine {
  public context!: GameContext

  isProcessing = false

  // 생성자에서 받는 assets는 이제 경로가 아닌 실제 JSON 데이터 덩어리입니다.
  constructor(
    private assets: GameAssets,
    private renderer: Renderer,
    private saveSystem: SaveSystem,
    private configSystem: ConfigSystem,
    private eventBus: EventBus,
    private MapManagerClass?: new (data: MapData, eventBus: EventBus) => IMapManager
    // itemGenerator // 주입안하면 아이템이 만들어지지 않음
    // npcSkillManager // npc skill이 있다면 위에서 생성하여 주입하자
    // mapManager * 필수
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
    const mapManager: IMapManager = this.MapManagerClass 
      ? new this.MapManagerClass(mapData, this.eventBus) 
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
    const npcs = new NPCManager(npc, eventBus, initData?.npcs)
    const quest = new QuestManager(eventBus)
    new MonsterEvent(monsterFactory, eventBus, battle, world)
    const broadcastSystem = new Broadcast(npcs, eventBus)

    if (initData?.drop) {
      world.addLootBag(initData.drop)
    }

    this.context = {
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
        return this.map.getTile(this.player.pos)!;
      }
    } as GameContext

    player.onDeath = () => {
      const hostility = npcs.getFactionContribution('resistance')
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
      await handleCommand(command, this.context)
    } finally {
      this.isProcessing = false
    }
  }
}
