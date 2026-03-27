import enquirer from 'enquirer'
import i18n from '~/i18n'
import { Player } from '../core/player/Player'
import { printStatus } from '../statusPrinter'
import { GameContext, Renderer } from '../types'

export class CLIRenderer implements Renderer {
  // --- 출력 메서드 ---
  print(message: string): void {
    console.log(message)
  }

  update(message: string): void {
    process.stdout.write(`\rmessage`)
  }

  say(list: { name: string; hasQuest: boolean }[]) {
    const aliveNames = list.map(({ hasQuest, name }) => (hasQuest ? `\x1b[32m[!]\x1b[0m ${name}` : name)).join(', ')

    console.log(`${i18n.t('looking.around', { count: list.length })} ${aliveNames}`)
  }

  clear(): void {
    console.clear()
  }

  printStatus(player: Player, context: GameContext): void {
    printStatus(player, context)
  }

  // --- 입력 메서드 (Terminal가 호출할 비동기 로직) ---

  /**
   * 터미널 선택 메뉴를 띄웁니다.
   */
  async select(
    message: string,
    choices: { name: string; message: string; disabled?: boolean }[],
    defaultValue?: string
  ): Promise<string> {
    const { result } = await enquirer.prompt<{ result: string }>({
      type: 'select',
      name: 'result',
      message,
      initial: defaultValue,
      choices,
    })
    return result
  }

  /**
   * y/n 확인창을 띄웁니다.
   */
  async confirm(message: string): Promise<boolean> {
    const { result } = await enquirer.prompt<{ result: boolean }>({
      type: 'confirm',
      name: 'result',
      message,
      initial: false, // 기본값은 No
    })
    return result
  }

  /**
   * 메시지를 보여주고 Enter 입력을 기다립니다. (인트로용)
   */
  async prompt(message: string): Promise<void> {
    await enquirer.prompt({
      type: 'input',
      name: 'continue',
      message,
      result: () => '', // 입력값은 무시
      format: () => i18n.t('press_enter'),
    })
  }

  /**
   * 다중 선택 메뉴를 띄웁니다.
   */
  async multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number; validate?: (value: string[]) => string | true }
  ): Promise<string[]> {
    const { result } = await enquirer.prompt<{ result: string[] }>({
      type: 'multiselect',
      name: 'result',
      message,
      choices: choices.map((c) => ({ name: c.name, message: c.message })),
      initial: options?.initial,
      maxChoices: options?.maxChoices,
      validate: options?.validate,
    } as any)
    return result
  }

  move(directions: string[]) {
    console.log(i18n.t('paths_ahead') + directions.join(', '))
  }

  look(message: string) {
    console.log(message)
  }

  pick(origin: string, message?: string) {
    message && console.log(message)
  }

  attack(message: string, prefix?: string) {
    console.log((prefix || '') + message)
  }

  skill(message: string, prefix?: string) {
    console.log((prefix || '') + message)
  }
}
