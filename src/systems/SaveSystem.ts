import fs from 'fs'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { LootBag, NPCState } from '~/types'

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
  locale?: 'ko' | 'en'
}

export class SaveSystem {
  private isWeb = typeof window !== 'undefined'
  private defaultData: any
  private filePath: string = ''

  /**
   * @param config - CLI 환경에서는 파일 경로(string), 웹 환경에서는 기본 데이터 객체(any)를 전달받습니다.
   */
  constructor(config: string | any) {
    if (this.isWeb) {
      // 웹: 전달받은 객체를 기본값으로 저장
      this.defaultData = config
    } else {
      this.filePath = config
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
      locale: i18n.language,
      player: (saveData.player as any).raw || saveData.player,
    }

    if (this.isWeb) {
      localStorage.setItem('terminal_game_save', JSON.stringify(rawData))
    } else {
      fs.writeFileSync(this.filePath, JSON.stringify(rawData, null, 2))
    }
  }
}
