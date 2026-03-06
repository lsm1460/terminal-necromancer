import { Player } from '~/core/player/Player'
import { printStatus } from '~/statusPrinter'
import { useGameStore } from '~/stores/useGameStore'
import { GameContext, Renderer } from '~/types'

export interface UIState {
  type: 'SELECT' | 'MULTISELECT' | 'CONFIRM' | 'PROMPT' | 'NONE'
  message: string
  choices?: { name: string; message: string }[]
  options?: { initial?: string[]; maxChoices?: number }
  resolve: (value: any) => void
}

export class ReactRenderer implements Renderer {
  constructor() {}

  private get store() {
    return useGameStore.getState()
  }

  print(message: string): void {
    this.store.addLog(message)
  }

  update(message: string): void {
    this.store.updateLastLog(message)
  }

  clear(): void {
    this.store.clearLogs()
    this.store.setUI({ type: 'NONE', message: '', resolve: () => {} })
  }

  printStatus(player: Player, context: GameContext): void {
    this.store.setStatus({
      hp: player.hp,
      maxHp: player.maxHp,
      level: player.level,
      exp: player.exp,
      gold: player.gold,
      location: context.map.currentSceneId,
    })

    printStatus(player, context)
  }

  async select(message: string, choices: { name: string; message: string }[]): Promise<string> {
    return new Promise((resolve) => {
      this.store.setUI({
        type: 'SELECT',
        message,
        choices,
        resolve,
      })
    })
  }

  async confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.store.setUI({
        type: 'CONFIRM',
        message,
        resolve,
      })
    })
  }

  async prompt(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.store.setUI({
        type: 'PROMPT',
        message,
        resolve,
      })
    })
  }

  async multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number }
  ): Promise<string[]> {
    return new Promise((resolve) => {
      this.store.setUI({
        type: 'MULTISELECT',
        message,
        choices,
        options,
        resolve,
      })
    })
  }
}