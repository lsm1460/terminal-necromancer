import fs from 'fs'
import { ISaveSystem, SaveData } from '~/core/types'
import i18n from '~/i18n'
import { AppContext } from './types'

export class SaveSystem implements ISaveSystem<SaveData> {
  private isWeb = typeof window !== 'undefined'
  private filePath: string = ''

  constructor(savePath?: string) {
    if (!this.isWeb && savePath) {
      this.filePath = savePath
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

  static makeSaveData(context: AppContext) {
    return {
      player: context.player,
      sceneId: context.map.currentSceneId,
      npcs: context.npcs.getSaveData(),
      drop: context.world.lootBags,
      config: context.config || {},
      completedEvents: context.events.getSaveData(),
    } as SaveData
  }
}
