import fs from 'fs'
import path from 'path'
import { Player } from './core/Player'
import { MapManager } from './core/MapManager'
import { World } from './core/World'
import { EventSystem } from './systems/EventSystem'
import { MonsterFactory } from './core/MonsterFactory'
import { SaveSystem } from './systems/SaveSystem'
import { LootFactory } from './core/LootFactory'
import { printStatus } from './statusPrinter'
import { createCLI } from './cli'
import { DropSystem } from './systems/DropSystem'

// ---------- 데이터 로드 ----------
const assets = path.join(__dirname, 'assets')
const mapPath = path.join(assets, 'map.json')
const monsterData = JSON.parse(fs.readFileSync(path.join(assets, 'monster.json'), 'utf-8'))
const statePath = path.join(assets, 'state.json')
const levelPath = path.join(assets, 'level.json')
const itemPath = path.join(assets, 'item.json')
const dropPath = path.join(assets, 'drop.json')

// ---------- 초기화 ----------
const save = new SaveSystem(statePath)
const drop = new DropSystem(itemPath, dropPath)
const monster = new MonsterFactory(monsterData, drop)
const saved = save.load()
const player = new Player(levelPath, saved.player)
const map = new MapManager(mapPath)
const world = new World(map)
const events = new EventSystem(monster)

if (saved.drops?.length) {
  for (const drop of saved.drops) {
    world.addLootBag(drop)
  }
}

player.onDeath = () => {
  console.log('나는 사망했다...')
  world.addLootBag(LootFactory.fromPlayer(player))

  player.clearEquipment()
  player.x = 0
  player.y = 0
  player.hp = 1

  printStatus(player, map, world)  
}

// ---------- 게임 시작 ----------
console.log('=== 게임 시작 ===')
printStatus(player, map, world)

// ---------- CLI 시작 ----------
createCLI(player, { map, world, events, save })
