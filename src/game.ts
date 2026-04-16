import fs from 'fs'
import path from 'path'
import { GameAssets } from './assets'
import { loadExtraLocaleBundle } from './assets/locales'
import { createCLI } from './cli'
import { Terminal } from './core/Terminal'
import { Title } from './core/Title'
import { GameEngine } from './gameEngine'
import i18n from './i18n'
import { CLIRenderer } from './renderers/cliRenderer'
import { EventBus } from './systems/EventBus'
import { SaveSystem } from './systems/SaveSystem'
import { GameEventType } from './types/event'
import { ConfigSystem } from './systems/ConfigSystem'

const loadJSON = (filePath: string) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const assetsDir = path.join(__dirname, 'assets')
const statePath = path.join(assetsDir, 'state.json')
const configPath = path.join(assetsDir, 'config.json')
const initState = loadJSON(path.join(assetsDir, 'init_state.json'))

const save = new SaveSystem(statePath)
const config = new ConfigSystem(configPath)
const _config = config.load()
const locale = _config?.locale || 'ko'

const assets: GameAssets = {
  map: loadJSON(path.join(assetsDir, 'map.json')),
  monsterGroup: loadJSON(path.join(assetsDir, 'monster-group.json')),
  monster: loadJSON(path.join(assetsDir, 'monster.json')),
  state: loadJSON(statePath),
  level: loadJSON(path.join(assetsDir, 'level.json')),
  item: loadJSON(path.join(assetsDir, 'item.json')),
  drop: loadJSON(path.join(assetsDir, 'drop.json')),
  npc: loadJSON(path.join(assetsDir, 'npc.json')),
  npcSkills: loadJSON(path.join(assetsDir, 'npcSkills.json')),
}

const run = async () => {
  const renderer = new CLIRenderer()
  Terminal.setRenderer(renderer)

  const eventBus = new EventBus()
  const engine = new GameEngine(assets, renderer, save, config, eventBus)

  await i18n.changeLanguage(locale)

  const playData = await Title.gameStart(save, config, initState)
  if (playData === null) {
    return
  }

  if (!playData) {
    console.error('게임 데이터를 불러오지 못했습니다.')
    return
  }

  const currentLocale = i18n.language as 'ko' | 'en'
  await loadExtraLocaleBundle(currentLocale)

  await engine.init(playData)
  await engine.start()

  const exitWait = new Promise<void>((resolve) => {
    eventBus.subscribe(GameEventType.SYSTEM_EXIT, () => {
      resolve()
    })
  })

  createCLI(engine.context)

  await exitWait

  Terminal.clear()

  setTimeout(() => run(), 0)
}

run()
