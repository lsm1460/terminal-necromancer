import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { printStatus } from '~/statusPrinter'
import { useGameStore } from '~/stores/useGameStore'
import { GameContext, Renderer } from '~/types'

export interface UIState {
  type: 'SELECT' | 'MULTISELECT' | 'CONFIRM' | 'PROMPT' | 'NONE'
  message: string
  choices?: { name: string; message: string; disabled?: boolean }[]
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
    printStatus(player, context)
  }

  async select(message: string, choices: { name: string; message: string }[], defaultValue?: string): Promise<string> {
    // TODO: defaultValue 연결하기
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

  private createButton(label: string, command: string, arg?: string): string {
    const dataArg = arg ? ` data-arg="${arg}"` : ''
    return `<button tabindex="-1" class="text-button" data-command="${command}"${dataArg}>${label}</button>`
  }

  say(list: { name: string; hasQuest: boolean }[]) {
    const aliveNames = list
      .map(({ hasQuest, name }) => {
        const label = `${hasQuest ? '<span style="color: #ff8181">[!] </span>' : ''}${name}`

        return this.createButton(label, 'talk', name)
      })
      .join(', ')

    const message = `${i18n.t('looking.around', { count: aliveNames.length })} ${aliveNames}`

    this.store.addLog(message)
  }

  move(directions: string[]) {
    const pathButtons = directions.map((path) => this.createButton(path, path)).join(', ')

    const message = `${i18n.t('paths_ahead')} ${pathButtons}`

    this.store.addLog(message)
  }

  look(message: string, name: string, type: string) {
    this.store.addLog(this.createButton(message, 'look', `${type} --${name}`))
  }

  pick(origin: string, message?: string) {
    this.store.addLog(this.createButton(message || i18n.t('commands.pick'), 'pick', origin))
  }

  attack(message: string, prefix?: string) {
    this.store.addLog((prefix || '') + this.createButton(message, 'attack'))
  }

  skill(message: string, prefix?: string) {
    this.store.addLog((prefix || '') + this.createButton(message, 'skill'))
  }
}
