import readline from 'readline'
import i18n from '~/i18n'
import { GameEngine } from './gameEngine'

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

export async function createCLI(engine: GameEngine) {
  while (true) {
    const line = await askQuestion(i18n.t('input_command'))

    const result = await engine.processCommand(line)
    if (result === 'exit' || line.trim() === 'exit') break
  }
}
