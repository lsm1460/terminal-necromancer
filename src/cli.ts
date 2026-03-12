import readline from 'readline'
import { handleCommand } from '~/commandHandler'
import i18n from './i18n'

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

export async function createCLI(player: any, context: any) {
  while (true) {
    const line = await askQuestion(i18n.t('input_command'))
    const shouldExit = await handleCommand(line, player, context)
    if (shouldExit === 'exit') break
  }
}
