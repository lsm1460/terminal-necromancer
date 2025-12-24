import readline from 'readline'
import { handleCommand } from './commandHandler'
import { GameContext } from './types'

export function createCLI(player: any, context: any) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  context.rl = rl

  rl.setPrompt('명령(명령어 리스트: 도움말): ')
  console.log()
  rl.prompt()

  rl.on('line', (line: string) => {
    handleCommand(line, player, context)
  })
}

export const printPrompt = (context: GameContext) => {
  console.log()
  context.rl.prompt()
}