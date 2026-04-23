import readline from 'readline'
import i18n from '~/i18n'
import { GameContext } from './types'

async function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

export async function createCLI(context: GameContext) {
  while (true) {
    const line = await askQuestion(i18n.t('input_command'))
    const shouldExit = await context.commands.handle(line, context)
    if (shouldExit === 'exit') return 'exit'
  }
}
