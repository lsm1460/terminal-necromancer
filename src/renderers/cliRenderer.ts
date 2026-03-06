import enquirer from 'enquirer'
import { Player } from '../core/player/Player'
import { GameContext, Renderer } from '../types'
import { printStatus } from '../statusPrinter'

export class CLIRenderer implements Renderer {
  // --- 출력 메서드 ---
  print(message: string): void {
    console.log(message)
  }

  update(message: string): void {
    process.stdout.write(`\rmessage`)
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
  async select(message: string, choices: { name: string; message: string }[]): Promise<string> {
    const { result } = await enquirer.prompt<{ result: string }>({
      type: 'select',
      name: 'result',
      message,
      // enquirer의 select 형식에 맞게 choices 매핑
      choices: choices.map((c) => ({ name: c.name, message: c.message })),
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
      format: () => ' [Enter를 누르면 계속]',
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
      validate: options?.validate
    } as any)
    return result
  }
}
