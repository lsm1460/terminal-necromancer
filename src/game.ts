import path from 'path'
import { createCLI } from './cli'
import { CLIRenderer } from './cliRenderer'
import { GameEngine } from './gameEngine'
import { Title } from './core/Title'
import { SaveSystem } from './systems/SaveSystem'
import { Logger } from './core/Logger'

// ---------- 데이터 로드 ----------
const assetsDir = path.join(__dirname, 'assets')
const assets = {
  mapPath: path.join(assetsDir, 'map.json'),
  monsterGroupPath: path.join(assetsDir, 'monster-group.json'),
  monsterPath: path.join(assetsDir, 'monster.json'),
  statePath: path.join(assetsDir, 'state.json'),
  levelPath: path.join(assetsDir, 'level.json'),
  itemPath: path.join(assetsDir, 'item.json'),
  dropPath: path.join(assetsDir, 'drop.json'),
  npcPath: path.join(assetsDir, 'npc.json'),
  eventPath: path.join(assetsDir, 'events.json'),
  npcSkillPath: path.join(assetsDir, 'npcSkills.json'),
  broadcastPath: path.join(assetsDir, 'broadcast.json'),
}

// ---------- 초기화 ----------
const save = new SaveSystem(assets.statePath)
const renderer = new CLIRenderer()
Logger.setRenderer(renderer)
const engine = new GameEngine(assets, renderer)

Title.gameStart(save).then(async (playData) => {
  await engine.init(playData!)
  await engine.start()

  createCLI(engine.player, engine.context)
})
