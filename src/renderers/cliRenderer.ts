import enquirer from 'enquirer'
import { printTileStatus } from '~/core/statusPrinter'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { Renderer } from '~/types'

export class CLIRenderer implements Renderer {
  // --- 출력 메서드 ---
  print(message: string): void {
    console.log(message)
  }

  update(message: string): void {
    process.stdout.write(`\rmessage`)
  }

  availableTalks(list: { name: string; hasQuest: boolean }[]) {
    const aliveNames = list.map(({ hasQuest, name }) => (hasQuest ? `\x1b[32m[!]\x1b[0m ${name}` : name)).join(', ')

    console.log(`${i18n.t('looking.around', { count: list.length })} ${aliveNames}`)
  }

  clear(): void {
    console.clear()
  }

  printStatus(context: GameContext): void {
    printTileStatus(context)
  }

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

  async confirm(message: string): Promise<boolean> {
    const { result } = await enquirer.prompt<{ result: boolean }>({
      type: 'confirm',
      name: 'result',
      message,
      initial: false, // 기본값은 No
    })
    return result
  }

  async prompt(message: string): Promise<void> {
    await enquirer.prompt({
      type: 'input',
      name: 'continue',
      message,
      result: () => '', // 입력값은 무시
      format: () => i18n.t('press_enter'),
    })
  }

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

  pick(origin: string, message?: string) {}

  attack(message: string, prefix?: string) {
    console.log((prefix || '') + message)
  }

  skill(message: string, prefix?: string) {
    console.log((prefix || '') + message)
  }

  talk() {}

  printNpcCard(npc: GameNPC) {
    const greeting = npc.getScripts('greeting')

    console.log(`\n──────────────────────────────────────────────────`)
    console.log(`  👤 [${npc.name}] - ${npc.description}`)
    console.log(`  💬 "${greeting}"`)
    console.log(`──────────────────────────────────────────────────`)
  }
}
