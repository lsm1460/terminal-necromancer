import readline from 'readline'
import { handleCommand } from '~/commandHandler'

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
    const line = await askQuestion('명령(명령어 리스트: 도움말) > ')
    const shouldExit = await handleCommand(line, player, context)
    if (shouldExit === 'exit') break
  }
}
