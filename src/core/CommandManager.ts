import { Terminal } from '~/core'
import { COMMAND_GROUPS } from './consts'
import { CommandFunction, GameContext, ICommandManager } from './types'

export class CommandManager implements ICommandManager {
  private commands: Map<string, CommandFunction<any>> = new Map()
  private customGroups: Map<string, string[]> = new Map()

  constructor() {
    this.initializeDefaultGroups()
  }

  private initializeDefaultGroups() {
    Object.entries(COMMAND_GROUPS).forEach(([key, aliases]) => {
      this.customGroups.set(key, [...aliases])
    })
  }

  private mapInput(cmd: string): string {
    const trimmed = cmd.trim()

    for (const [key, aliases] of this.customGroups.entries()) {
      if (aliases.includes(trimmed)) return key
    }

    return trimmed
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

  add(_commands: Record<string, string[]>) {
    Object.entries(_commands).forEach(([key, aliases]) => {
      const existing = this.customGroups.get(key) || []

      this.customGroups.set(key, Array.from(new Set([...existing, ...aliases])))
    })
  }

  register(key: string, fn: CommandFunction<any>): void {
    this.commands.set(key, fn)
  }

  async handle(rawCmd: string, context: GameContext): Promise<string | boolean> {
    const trimmed = rawCmd.trim()
    if (!trimmed) return false

    const { cmd: rawCmdName, args } = this.parseCommand(trimmed)
    const cmd = this.mapInput(rawCmdName)
    const fn = this.commands.get(cmd)
    const cheatFn = this.commands.get(trimmed)

    if (cheatFn) {
      return await cheatFn([], context)
    }

    if (!fn) {
      Terminal.log({ key: 'invalid_command' })
      return false
    }

    try {
      return await fn(args, context)
    } catch (e) {
      console.error(e)
      return false
    }
  }

  clear(): void {
    this.commands.clear()
    this.customGroups.clear()
    this.initializeDefaultGroups()
  }
}
