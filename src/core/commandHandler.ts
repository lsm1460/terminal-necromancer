import * as Commands from '~/commands'
import { COMMAND_GROUPS, CommandKey } from '~/consts'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { printDirections, printTileStatus } from './statusPrinter'

type CommandFunction = (
  args: string[],
  context: AppContext
) => (boolean | string) | Promise<boolean | string>

const mapInput = (cmd: string) => {
  const trimmed = cmd.trim()

  const _cmd = Object.entries(COMMAND_GROUPS).find(([_, arr]) => arr.includes(trimmed))?.[0] ?? trimmed
  return _cmd as CommandKey
}

const parseCommand = (rawCmd: string) => {
  const trimmed = rawCmd.trim()

  const firstSeparatorIndex = trimmed.search(/\s+|--/)

  // 구분자가 없으면 인자가 없는 단일 명령어로 처리
  if (firstSeparatorIndex === -1) {
    return { cmd: trimmed, args: [] }
  }

  const cmd = trimmed.slice(0, firstSeparatorIndex)
  const remaining = trimmed.slice(firstSeparatorIndex)

  // 2. 나머지 부분을 '--'를 기준으로 나눔
  const args = remaining
    .split('--')
    .map((arg) => arg.trim())
    .filter((arg) => arg.length > 0)

  return { cmd, args }
}

// --- COMMANDS 객체 ---
const COMMANDS: Record<CommandKey, CommandFunction> = {
  up: Commands.moveCommand('up'),
  down: Commands.moveCommand('down'),
  left: Commands.moveCommand('left'),
  right: Commands.moveCommand('right'),
  attack: Commands.attackCommand,
  equip: Commands.equipCommand,
  exit: Commands.exitCommand,
  pick: Commands.pickCommand,
  drop: Commands.dropCommand,
  help: Commands.helpCommand,
  inventory: Commands.inventoryCommand,
  status: Commands.statusCommand,
  look: Commands.lookCommand,
  clear: Commands.clearCommand,
  skill: Commands.skillCommand,
  talk: Commands.talkCommand,
  use: Commands.useCommand,
  map: Commands.mapCommand,
}

export async function handleCommand(rawCmd: string, context: AppContext): Promise<string | boolean> {
  const trimmed = rawCmd.trim()
  if (!trimmed) return false

  // 치트키 처리
  if (Commands.handleCheat(trimmed, context)) {
    return true
  }

  const { cmd: rawCmdName, args } = parseCommand(trimmed)
  const cmd = mapInput(rawCmdName)

  if (!cmd || !COMMANDS[cmd]) {
    Terminal.log(`\n` + i18n.t('invalid_command'))
    return false
  }

  const fn = COMMANDS[cmd]

  try {
    // 여기서 await을 통해 talkCommand 등의 메뉴 선택이 끝날 때까지 대기합니다.
    const result = await fn(args, context)
    if (result === 'exit') return 'exit'

    if (result) {
      const { map, currentTile } = context
      printTileStatus(context)

      await map.handleTileEvent(currentTile, context)
    }

    if (context.quest.hasQuest()) {
      await context.quest.startQuest(context)
    } else {
      printDirections(context)
    }
  } catch (e) {}

  return false
}
