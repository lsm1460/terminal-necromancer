import { GameAssets } from './assets'
import { handleCommand } from './commandHandler'
import { MAP_IDS } from './consts'
import { Battle } from './core/battle/Battle'
import { Broadcast } from './core/Broadcast'
import { LootFactory } from './core/LootFactory'
import { MapManager } from './core/MapManager'
import { MonsterFactory } from './core/MonsterFactory'
import { NPCManager } from './core/NpcManager'
import { Player } from './core/player/Player'
import { NpcSkillManager } from './core/skill/npcs/NpcSkillManger'
import { World } from './core/World'
import i18n from './i18n'
import { printDirections } from './statusPrinter'
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'
import { SaveData, SaveSystem } from './systems/SaveSystem'
import { GameContext, Renderer } from './types'

export class GameEngine {
  public player!: Player
  public context!: GameContext

  isProcessing = false

  // 생성자에서 받는 assets는 이제 경로가 아닌 실제 JSON 데이터 덩어리입니다.
  constructor(
    private assets: GameAssets,
    private renderer: Renderer,
    private saveSystem: SaveSystem
  ) {}

  public async init(initData?: SaveData): Promise<void> {
    const { item, drop, monsterGroup, monster, level, npcSkills, map, npc, state } = this.assets

    const dropSystem = new DropSystem(item, drop)
    const monsterFactory = new MonsterFactory(monsterGroup, monster)
    const player = new Player(level, initData?.player)
    const eventSystem = new EventSystem(monsterFactory, initData?.completedEvents)
    const npcSkillManager = new NpcSkillManager(npcSkills, player)
    const battle = new Battle(player, monsterFactory, npcSkillManager)
    const mapManager = new MapManager(map)
    const npcs = new NPCManager(npc, player, initData?.npcs)
    const world = new World(mapManager)
    const broadcastSystem = new Broadcast(npcs, eventSystem)

    if (initData?.drop) {
      world.addLootBag(initData.drop)
    }

    this.player = player
    this.context = {
      map: mapManager,
      world,
      events: eventSystem,
      npcs,
      drop: dropSystem,
      save: this.saveSystem,
      battle,
      broadcast: broadcastSystem,
      monster: monsterFactory,
      config: initData?.config || {},
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

      this.renderer.printStatus(player, this.context)
    }
  }

  public async start(): Promise<void> {
    const { map, events } = this.context
    this.renderer.printStatus(this.player, this.context)

    const currentTile = map.getTile(this.player.pos.x, this.player.pos.y)
    await events.handle(currentTile, this.player, this.context)

    printDirections(this.player, this.context)
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
      await handleCommand(command, this.player, this.context)
    } finally {
      this.isProcessing = false
    }
  }
}
