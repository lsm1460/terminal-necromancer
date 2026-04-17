import { GameAssets } from '~/assets'
import { MAP_IDS } from '~/consts'
import { Battle, BattleComponentFactory } from '~/core/battle'
import { LootFactory } from '~/core/LootFactory'
import { MonsterFactory } from '~/core/MonsterFactory'
import { Player } from '~/core/player/Player'
import { NpcSkillManager } from '~/core/skill/npcs/NpcSkillManger'
import { World } from '~/core/World'
import i18n from '~/i18n'
import { Broadcast } from '~/systems/Broadcast'
import { ConfigSystem } from '~/systems/ConfigSystem'
import { DropSystem } from '~/systems/DropSystem'
import { EventBus } from '~/core/EventBus'
import { EventLedger } from '~/systems/EventLedger'
import { MonsterEvent } from '~/systems/events/MonsterEvent'
import { MapManager } from '~/systems/MapManager'
import { NPCManager } from '~/systems/NpcManager'
import { QuestManager } from '~/systems/QuestManager'
import { SaveData, SaveSystem } from '~/systems/SaveSystem'
import { GameContext, Renderer } from '~/types'
import { handleCommand } from './commandHandler'
import { printDirections } from './statusPrinter'

export class GameEngine {
  public context!: GameContext

  isProcessing = false

  // 생성자에서 받는 assets는 이제 경로가 아닌 실제 JSON 데이터 덩어리입니다.
  constructor(
    private assets: GameAssets,
    private renderer: Renderer,
    private saveSystem: SaveSystem,
    private configSystem: ConfigSystem,
    private eventBus: EventBus
  ) {}

  public async init(initData: SaveData): Promise<void> {
    const { item, drop, monsterGroup, monster, level, npcSkills, map, npc, state } = this.assets

    const dropSystem = new DropSystem(item, drop)
    const monsterFactory = new MonsterFactory(monsterGroup, monster)

    const eventBus = this.eventBus
    const player = new Player(level, eventBus, initData?.player)
    const mapManager = new MapManager(map, eventBus)
    const world = new World(player, eventBus)
    const eventLedger = new EventLedger(eventBus, initData?.completedEvents)
    const npcSkillManager = new NpcSkillManager(npcSkills, player)
    const battleFactory = new BattleComponentFactory(player, npcSkillManager, world, dropSystem, eventBus)
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
    const { map, player } = this.context
    this.renderer.printStatus(this.context)

    const currentTile = map.getTile(player.pos)
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
