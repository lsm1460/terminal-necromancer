import path from 'path'
import { assets, initState, loadExtraLocaleBundle } from './assets'
import { createCLI, Terminal } from './core'
import i18n from './i18n'
import { CLIRenderer } from './renderers/cliRenderer'
import { GameBootstrapper } from './systems/Bootstrapper'

const assetsDir = path.join(__dirname, 'assets')

const bootstrapper = new GameBootstrapper({
  statePath: path.join(assetsDir, 'state.json'),
  configPath: path.join(assetsDir, 'config.json'),
  achievementPath: path.join(assetsDir, 'archives.json'),
})

const start = async () => {
  const config = bootstrapper.configSystem.load()
  const locale = config?.locale || 'ko'
  await i18n.changeLanguage(locale)
  await loadExtraLocaleBundle(locale as 'ko' | 'en')

  const engine = await bootstrapper.run({
    renderer: new CLIRenderer(),
    translator: (info) => (typeof info === 'string' ? info : (i18n.t(info.key, info.args) as string)),
    assets,
    initState,
    onExit: () => {
      Terminal.clear()
      setTimeout(start, 0) // 재시작 루프
    },
  })

  if (!engine) {
    process.exit(0)
    return
  }

  await engine.start()
  createCLI(engine)
}

start()
