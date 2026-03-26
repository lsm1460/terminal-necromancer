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

  say(list: { name: string; hasQuest: boolean }[]) {
    const aliveNames = list
      .map(
        ({ hasQuest, name }) =>
          `<button tabindex="-1" class="text-button" data-command="대화" data-arg="${name}">${hasQuest ? '<span style="color: #ff8181">[!] </span>' : ''}${name}</button>`
      )
      .join(', ')

    const message = `${i18n.t('looking.around', { count: aliveNames.length })} ${aliveNames}`

    this.store.addLog(message)
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

  move(directions: string[]) {
    const pathButtons = directions
      .map((path) => `<button tabindex="-1" class="text-button" data-command="${path}">${path}</button>`)
      .join(', ')

    const message = `${i18n.t('paths_ahead')} ${pathButtons}`

    this.store.addLog(message)
  }

  look(message: string, name: string, type: string) {
    this.store.addLog(
      `<button tabindex="-1" class="text-button" data-command="look" data-arg="${type} --${name}">${message}</button>`
    )
  }

  pick(origin: string) {
    this.store.addLog(
      `<button tabindex="-1" class="text-button" data-command="pick" data-arg="${origin}">${i18n.t('commands.pick')}</button>`
    )
  }
}
