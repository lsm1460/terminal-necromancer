import fs from 'fs'
import { mapValues } from 'lodash'
import path from 'path'
import { GameAssets } from './assets'
import { createCLI } from './cli'
import { Terminal } from './core/Terminal'
import { Title } from './core/Title'
import { GameEngine } from './gameEngine'
import i18n from './i18n'
import { CLIRenderer } from './renderers/cliRenderer'
import { SaveSystem } from './systems/SaveSystem'

const loadJSON = (filePath: string) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const assetsDir = path.join(__dirname, 'assets')
const statePath = path.join(assetsDir, 'state.json')
const initState = loadJSON(path.join(assetsDir, 'init_state.json'))

const save = new SaveSystem(statePath)
const { locale = 'ko' } = save.load() || {}

const assets: GameAssets = {
  map: loadJSON(path.join(assetsDir, 'map.json')),
  monsterGroup: loadJSON(path.join(assetsDir, 'monster-group.json')),
  monster: loadJSON(path.join(assetsDir, 'monster.json')),
  state: loadJSON(statePath),
  level: loadJSON(path.join(assetsDir, 'level.json')),
  item: loadJSON(path.join(assetsDir, 'item.json')),
  drop: loadJSON(path.join(assetsDir, 'drop.json')),
  npc: loadJSON(path.join(assetsDir, 'npc.json')),
  events: loadJSON(path.join(assetsDir, 'events.json')),
  npcSkills: loadJSON(path.join(assetsDir, 'npcSkills.json')),
  broadcast: loadJSON(path.join(assetsDir, 'broadcast.json')),
}

const renderer = new CLIRenderer()
Terminal.setRenderer(renderer)

const engine = new GameEngine(assets, renderer, save)

i18n.changeLanguage(locale).then(() => {
  Title.gameStart(save, initState).then(async (playData) => {
    if (!playData) {
      console.error('게임 데이터를 불러오지 못했습니다.')
      return
    }

    await engine.init(playData)
    await engine.start()

    await createCLI(engine.player, engine.context)
  })
})
