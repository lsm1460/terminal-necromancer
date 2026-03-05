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
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'
import { SaveData, SaveSystem } from './systems/SaveSystem'
import { GameContext, Renderer } from './types'

export class GameEngine {
  public player!: Player
  public context!: GameContext

  // 생성자에서 받는 assets는 이제 경로가 아닌 실제 JSON 데이터 덩어리입니다.
  constructor(
    private assets: GameAssets,
    private renderer: Renderer,
    private saveSystem: SaveSystem
  ) {}

  public async init(initData?: SaveData): Promise<void> {
    const { item, drop, monsterGroup, monster, level, events, npcSkills, map, npc, broadcast, state } = this.assets

    const dropSystem = new DropSystem(item, drop)
    const monsterFactory = new MonsterFactory(monsterGroup, monster)
    const player = new Player(level, initData?.player)
    const eventSystem = new EventSystem(events, monsterFactory, initData?.completedEvents)
    const npcSkillManager = new NpcSkillManager(npcSkills, player)
    const battle = new Battle(player, monsterFactory, npcSkillManager)
    const mapManager = new MapManager(map)
    const npcs = new NPCManager(npc, player, initData?.npcs)
    const world = new World(mapManager)
    const broadcastSystem = new Broadcast(broadcast, npcs, eventSystem)

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
    } as GameContext

    player.onDeath = () => {
      const hostility = npcs.getFactionContribution('resistance')
      const isHostile = hostility >= 70

      this.renderer.print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      this.renderer.print(`📡 [터미널 브로드캐스팅: 에코]`)

      if (isHostile) {
        this.renderer.print(`  📢 "알립니다. 레지스탕스와 결탁하여 소란을 피우던 사령술사가 방금 제압되었습니다."`)
        this.renderer.print(
          `  📢 "살아있는 반역자들과 어울리더니 끝내 시체가 되었군요. 물론 조만간 다시 기어 나오겠지만 말입니다."`
        )
      } else {
        this.renderer.print(`  📢 "알립니다. 사령술사가 활동을 중단했습니다."`)
        this.renderer.print(`  📢 "어차피 금방 다시 재생될 테니, 서류 처리는 좀 천천히 해도 될 것으로 보입니다."`)
      }

      this.renderer.print(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      this.renderer.print('\n💀 나의 영혼들은 조각났다... (다시 육체를 재구성하는 감각이 느껴집니다.)\n')

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

      this.renderer.printStatus(player, this.context)
    }
  }

  public async start(): Promise<void> {
    const { map, events } = this.context
    this.renderer.printStatus(this.player, this.context)

    const currentTile = map.getTile(this.player.pos.x, this.player.pos.y)
    await events.handle(currentTile, this.player, this.context)
  }

  public async processCommand(command: string): Promise<void> {
    await handleCommand(command, this.player, this.context)
  }
}
