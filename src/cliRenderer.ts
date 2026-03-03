import { Player } from './core/player/Player'
import { GameContext, Renderer } from './types'
import { printStatus } from './statusPrinter'

export class CLIRenderer implements Renderer {
  print(message: string): void {
    console.log(message)
  }

  clear(): void {
    console.clear()
  }

  printStatus(player: Player, context: GameContext): void {
    printStatus(player, context)
  }
}
