import path from 'path'
import { createCLI } from './cli'
import { MAP_IDS } from './consts'
import { Battle } from './core/Battle'
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
const npcSkills = new NpcSkillManager(npcSkillPath, player)

if (saved?.drop) {
  world.addLootBag(saved.drop)
}

const context = { map, world, events, npcs, drop, save, npcSkills, battle }

player.onDeath = () => {
  console.log('나는 사망했다...')
  world.addLootBag(LootFactory.fromPlayer(player, map))

  player.x = 0
  player.y = 0
  player.hp = 1

  printStatus(player, context as GameContext)
}

// 시작 위치 초기화
map.currentSceneId = MAP_IDS.B1_SUBWAY
player.x = 0
player.y = 0

// ---------- 게임 시작 ----------
console.log('=== 게임 시작 ===')
printStatus(player, context as GameContext)

// ---------- CLI 시작 ----------

const currentTile = map.getTile(player.pos.x, player.pos.y)
events.handle(currentTile, player, context as GameContext).then(() => {
  createCLI(player, context)
})
