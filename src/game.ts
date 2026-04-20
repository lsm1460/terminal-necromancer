import fs from 'fs'
import path from 'path'
import { GameAssets } from './assets'
import { loadExtraLocaleBundle } from './assets/locales'
import { createCLI } from './core/cli'
import { EventBus } from './core/EventBus'
import { GameEngine } from './core/gameEngine'
import { Terminal } from './core/Terminal'
import { Title } from './core/Title'
import { GameEventType } from './core/types'
import i18n from './i18n'
import { CLIRenderer } from './renderers/cliRenderer'
import { AchievementManager } from './systems/AchievementManager'
import { ConfigSystem } from './systems/ConfigSystem'
import { SkillEffectPresenter } from './systems/presenter/SkillEffectPresenter'
import { SaveSystem } from './systems/SaveSystem'

const loadJSON = (filePath: string) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const assetsDir = path.join(__dirname, 'assets')
const statePath = path.join(assetsDir, 'state.json')
const configPath = path.join(assetsDir, 'config.json')
const achievementPath = path.join(assetsDir, 'archives.json')
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
  achievements: loadJSON(path.join(assetsDir, 'achievements.json')),
}

const eventBus = new EventBus()

new SkillEffectPresenter(eventBus)

const run = async () => {
  const renderer = new CLIRenderer()
  Terminal.setRenderer(renderer)
  Terminal.setTranslator((info) => {
    if (typeof info === 'string') return info
    return i18n.t(info.key, info.args)
  })

  const engine = new GameEngine(assets, renderer, save, config, eventBus)

  await i18n.changeLanguage(locale)

  const achievement = new AchievementManager(eventBus, assets.achievements, achievementPath)

  const title = new Title(save, config, achievement)

  const playData = await title.gameStart(initState)
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
