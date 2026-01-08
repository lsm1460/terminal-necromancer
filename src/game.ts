import fs from 'fs'
import path from 'path'
import { createCLI } from './cli'
import { LootFactory } from './core/LootFactory'
import { MapManager } from './core/MapManager'
import { MonsterFactory } from './core/MonsterFactory'
import { NPCManager } from './core/NpcManager'
import { Player } from './core/Player'
import { World } from './core/World'
import { printStatus } from './statusPrinter'
import { DropSystem } from './systems/DropSystem'
import { EventSystem } from './systems/EventSystem'
import { SaveSystem } from './systems/SaveSystem'
import { GameContext } from './types'

// ---------- 데이터 로드 ----------
const assets = path.join(__dirname, 'assets')
const mapPath = path.join(assets, 'map.json')
const monsterPath = path.join(assets, 'monster.json')
const statePath = path.join(assets, 'state.json')
const levelPath = path.join(assets, 'level.json')
const itemPath = path.join(assets, 'item.json')
const dropPath = path.join(assets, 'drop.json')
const npcPath = path.join(assets, 'npc.json')
const eventPath = path.join(assets, 'events.json')

// ---------- 초기화 ----------
const save = new SaveSystem(statePath)
const drop = new DropSystem(itemPath, dropPath)
const monster = new MonsterFactory(monsterPath)
const saved = save.load()
const player = new Player(levelPath, saved?.player)
const map = new MapManager(mapPath, saved?.sceneId)
const npcs = new NPCManager(npcPath, saved?.npcs)
const world = new World(map)
const events = new EventSystem(eventPath, monster, saved?.completedEvents)

if (saved?.drop) {
  world.addLootBag(saved.drop)
}

const context = { map, world, events, npcs, drop, save }

player.onDeath = () => {
  console.log('나는 사망했다...')
  world.addLootBag(LootFactory.fromPlayer(player))

  player.clearEquipment()
  player.x = 0
  player.y = 0
  player.hp = 1

  printStatus(player, context as GameContext)
}

// ---------- 게임 시작 ----------
console.log('=== 게임 시작 ===')
printStatus(player, context as GameContext)

// ---------- CLI 시작 ----------
createCLI(player, context)
