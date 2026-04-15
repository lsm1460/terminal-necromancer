import fs from 'fs'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, LootBag, NPCState } from '~/types'

export type SaveData = {
  player: Player
  sceneId: string
  npcs: {
    states: Record<string, NPCState>
    factionHostility: Record<string, number>
    factionContribution: Record<string, number>
  }
  drop: LootBag | null
  completedEvents: string[]
}

export type ConfigData = {
  locale?: 'ko' | 'en'
}

export class SaveSystem {
  private isWeb = typeof window !== 'undefined'
  private filePath: string = ''
  private configPath: string = ''

  constructor(savePath?: string, configPath?: string) {
    if (!this.isWeb && savePath) {
      this.filePath = savePath
    }

    if (!this.isWeb && configPath) {
      this.configPath = configPath
    }
  }

  load(): SaveData | null {
    if (this.isWeb) {
      // 1. 브라우저 저장소 확인
      const saved = localStorage.getItem('terminal_game_save')
      if (saved) return JSON.parse(saved)

      return null
    } else {
      // CLI: 파일이 있으면 읽고, 없으면 null
      if (!fs.existsSync(this.filePath)) return null
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
    }
  }

  loadConfig(): ConfigData | undefined {
    if (this.isWeb) {
      // 1. 브라우저 저장소 확인
      const saved = localStorage.getItem('terminal_game_config')
      if (saved) return JSON.parse(saved)

      return
    } else {
      if (!fs.existsSync(this.configPath)) return
      return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    }
  }

  save(saveData: SaveData) {
    const rawData = {
      ...saveData,
      config: {
        locale: i18n.language,
      },
      player: (saveData.player as any).raw || saveData.player,
    }

    if (this.isWeb) {
      localStorage.setItem('terminal_game_save', JSON.stringify(rawData))
    } else {
      fs.writeFileSync(this.filePath, JSON.stringify(rawData, null, 2))
    }
  }

  saveConfig(config: ConfigData) {
    let _config = ''
    try {
      _config = JSON.stringify(config)
    } catch(e) {
      console.error('fail to make config data')
    }

    if (!_config) {
      console.error('fail to make config data')
      return
    }
    console.log('this.isWeb????', this.isWeb)
    if (this.isWeb) {
      console.log('????')
      localStorage.setItem('terminal_game_config', _config)
    } else {
      fs.writeFileSync(this.configPath, _config)
    }
  }

  static makeSaveData(context: GameContext) {
    return {
      player: context.player,
      sceneId: context.map.currentSceneId,
      npcs: context.npcs.getSaveData(),
      drop: context.world.lootBags,
      config: context.config || {},
      completedEvents: context.events.getSaveData(),
    }
  }
}
