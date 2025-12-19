import readline from 'readline'
import { handleCommand } from './commandHandler'

export function createCLI(player: any, context: any) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  context.rl = rl

  rl.setPrompt('\n명령(명령어 리스트: 도움말): ')
  rl.prompt()

  rl.on('line', (line: string) => {
    handleCommand(line, player, context)
  })
}