import { MAP_IDS } from './consts'
import { Battle } from './core/battle/Battle'
import { Broadcast } from './core/Broadcast'
import { LootFactory } from './core/LootFactory'
import { MapManager } from './core/MapManager'
import { MonsterFactory } from './core/MonsterFactory'
import { NPCManager } from './core/NpcManager'
import { Player } from './core/player/Player'
import { NpcSkillManager } from './core/skill/NpcSkillManger'
import { World } from './core/World'
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'
import { SaveData, SaveSystem } from './systems/SaveSystem'
import { GameContext, Renderer } from './types'

export interface GameAssets {
  mapPath: string
  monsterGroupPath: string
  monsterPath: string
  statePath: string
  levelPath: string
  itemPath: string
  dropPath: string
  npcPath: string
  eventPath: string
  npcSkillPath: string
  broadcastPath: string
}

export class GameEngine {
  public player!: Player
  public context!: GameContext

  constructor(private assets: GameAssets, private renderer: Renderer) {}

  public async init(initData: SaveData): Promise<void> {
    const {
      itemPath,
      dropPath,
      monsterGroupPath,
      monsterPath,
      levelPath,
      eventPath,
      npcSkillPath,
      mapPath,
      npcPath,
      broadcastPath,
      statePath,
    } = this.assets

    const save = new SaveSystem(statePath)
    const drop = new DropSystem(itemPath, dropPath)
    const monster = new MonsterFactory(monsterGroupPath, monsterPath)
    const player = new Player(levelPath, initData?.player)
    const events = new EventSystem(eventPath, monster, initData?.completedEvents)
    const npcSkills = new NpcSkillManager(npcSkillPath, player)
    const battle = new Battle(player, monster, npcSkills)
    const map = new MapManager(mapPath)
    const npcs = new NPCManager(npcPath, player, initData?.npcs)
    const world = new World(map)
    const broadcast = new Broadcast(broadcastPath, npcs, events)

    if (initData?.drop) {
      world.addLootBag(initData.drop)
    }

    this.player = player
    this.context = {
      map,
      world,
      events,
      npcs,
      drop,
      save,
      battle,
      broadcast,
      monster,
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

      const lootBag = LootFactory.fromPlayer(player, map)

      player.exp -= lootBag.exp
      player.gold -= lootBag.gold

      world.addLootBag(lootBag)

      if (map.currentSceneId !== MAP_IDS.B1_SUBWAY) {
        world.clearFloor()
      }

      map.currentSceneId = MAP_IDS.B1_SUBWAY
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
}
