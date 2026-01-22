import path from 'path'
import { createCLI } from './cli'
import { MAP_IDS } from './consts'
import { Battle } from './core/Battle'
import { Broadcast } from './core/Broadcast'
import { LootFactory } from './core/LootFactory'
import { MapManager } from './core/MapManager'
import { MonsterFactory } from './core/MonsterFactory'
import { NPCManager } from './core/NpcManager'
import { Player } from './core/Player'
import { NpcSkillManager } from './core/skill/NpcSkillManger'
import { World } from './core/World'
import { printStatus } from './statusPrinter'
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'
import { SaveSystem } from './systems/SaveSystem'
import { GameContext } from './types'

// ---------- 데이터 로드 ----------
const assets = path.join(__dirname, 'assets')
const mapPath = path.join(assets, 'map.json')
const monsterGroupPath = path.join(assets, 'monster-group.json')
const monsterPath = path.join(assets, 'monster.json')
const statePath = path.join(assets, 'state.json')
const levelPath = path.join(assets, 'level.json')
const itemPath = path.join(assets, 'item.json')
const dropPath = path.join(assets, 'drop.json')
const npcPath = path.join(assets, 'npc.json')
const eventPath = path.join(assets, 'events.json')
const npcSkillPath = path.join(assets, 'npcSkills.json')
const broadcastPath = path.join(assets, 'broadcast.json')

// ---------- 초기화 ----------
const save = new SaveSystem(statePath)
const drop = new DropSystem(itemPath, dropPath)
const monster = new MonsterFactory(monsterGroupPath, monsterPath)
const saved = save.load()
const player = new Player(levelPath, saved?.player)
const battle = new Battle(player)
const map = new MapManager(mapPath, saved?.sceneId)
const npcs = new NPCManager(npcPath, saved?.npcs)
const world = new World(map)
const events = new EventSystem(eventPath, monster, saved?.completedEvents)
const broadcast = new Broadcast(broadcastPath, npcs, events)
const npcSkills = new NpcSkillManager(npcSkillPath, player)

if (saved?.drop) {
  world.addLootBag(saved.drop)
}

const context = { map, world, events, npcs, drop, save, npcSkills, battle, broadcast }

player.onDeath = () => {
  const hostility = npcs.getFactionContribution('resistance');
  const isHostile = hostility >= 70;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 [터미널 브로드캐스팅: 에코]`);

  if (isHostile) {
    // 적대적일 때: 레지스탕스와 손잡은 네크로맨서의 최후를 비웃음
    console.log(`  📢 "알립니다. 레지스탕스와 결탁하여 소란을 피우던 사령술사가 방금 제압되었습니다."`);
    console.log(`  📢 "살아있는 반역자들과 어울리더니 끝내 시체가 되었군요. 물론 조만간 다시 기어 나오겠지만 말입니다."`);
  } else {
    // 일반 상태일 때: 지긋지긋한 부활 루프에 대한 행정 공고
    console.log(`  📢 "알립니다. 사령술사가 활동을 중단했습니다."`);
    console.log(`  📢 "어차피 금방 다시 재생될 테니, 서류 처리는 좀 천천히 해도 될 것으로 보입니다."`);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('\n💀 나는 사망했다... (다시 육체를 재구성하는 감각이 느껴집니다.)\n');

  world.addLootBag(LootFactory.fromPlayer(player, map))

  player.x = 0
  player.y = 0
  player.hp = 1

  printStatus(player, context as GameContext)
}

// 시작 위치 초기화
map.currentSceneId = MAP_IDS.title
player.x = 0
player.y = 0

// ---------- CLI 시작 ----------

const currentTile = map.getTile(player.pos.x, player.pos.y)
events.handle(currentTile, player, context as GameContext).then(() => {
  createCLI(player, context)
})
