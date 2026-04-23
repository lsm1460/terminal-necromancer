import { COMMAND_GROUPS } from '~/consts'
import { Terminal } from '~/core'
import { printDirections, printTileStatus } from './statusPrinter'
import { CommandFunction, GameContext, ICommandManager, IQuestManager } from './types'

export class CommandManager implements ICommandManager {
  private commands: Map<string, CommandFunction<any>> = new Map()

  constructor(private quests?: IQuestManager) {}

  register(key: string, fn: CommandFunction<any>): void {
    this.commands.set(key, fn)
  }

  private mapInput(cmd: string): string {
    const trimmed = cmd.trim()
    const mapped = Object.entries(COMMAND_GROUPS).find(([_, arr]) => arr.includes(trimmed))?.[0] ?? trimmed
    return mapped
  }

  private parseCommand(rawCmd: string) {
    const trimmed = rawCmd.trim()
    const firstSeparatorIndex = trimmed.search(/\s+|--/)

    if (firstSeparatorIndex === -1) {
      return { cmd: trimmed, args: [] }
    }

    const cmd = trimmed.slice(0, firstSeparatorIndex)
    const remaining = trimmed.slice(firstSeparatorIndex)

    const args = remaining
      .split('--')
      .map((arg) => arg.trim())
      .filter((arg) => arg.length > 0)

    return { cmd, args }
  }

  async handle(rawCmd: string, context: GameContext): Promise<string | boolean> {
    const trimmed = rawCmd.trim()
    if (!trimmed) return false

    const { cmd: rawCmdName, args } = this.parseCommand(trimmed)
    const cmd = this.mapInput(rawCmdName)

    const fn = this.commands.get(cmd)

    if (!fn) {
      // 치트키 등 특수 핸들러는 register를 통해 등록되어야 함
      Terminal.log({key: 'invalid_command'})
      return false
    }

    try {
      const result = await fn(args, context)
      if (result === 'exit') return 'exit'

      if (result) {
        const { map, currentTile } = context
        printTileStatus(context)
        await map.handleTileEvent(currentTile, context)
      }

      if (this.quests && this.quests.hasQuest()) {
        await this.quests.startQuest(context)
      } else {
        printDirections(context)
      }
      
      return result !== false
    } catch (e) {
      console.error(e)
      return false
    }
  }
}
