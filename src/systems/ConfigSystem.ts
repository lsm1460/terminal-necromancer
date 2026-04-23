import fs from 'fs'
import { IConfigSystem } from '~/core/types'

export type ConfigData = {
  locale?: 'ko' | 'en'
  isSearchFirst?: boolean
  isAutoInputFocus?: boolean
}

export class ConfigSystem implements IConfigSystem<ConfigData> {
  private isWeb = typeof window !== 'undefined'
  private configPath: string = ''

  constructor(configPath?: string) {
    if (!this.isWeb && configPath) {
      this.configPath = configPath
    }
  }

  load(): ConfigData | null {
    if (this.isWeb) {
      const saved = localStorage.getItem('terminal_game_config')
      if (saved) return JSON.parse(saved)
      return null
    } else {
      if (!this.configPath || !fs.existsSync(this.configPath)) return null
      return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    }
  }

  save(config: ConfigData) {
    let _config = ''
    try {
      _config = JSON.stringify(config)
    } catch (e) {
      console.error('fail to make config data')
    }

    if (!_config) return
    if (this.isWeb) {
      localStorage.setItem('terminal_game_config', _config)
    } else {
      if (this.configPath) {
        fs.writeFileSync(this.configPath, _config)
      }
    }
  }
}
