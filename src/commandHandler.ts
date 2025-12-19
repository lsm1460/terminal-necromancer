import * as Commands from './commands'
import { COMMAND_GROUPS } from './consts'
import { MapManager } from './core/MapManager'
import { Player } from './core/Player'
import { World } from './core/World'
import { printStatus } from './statusPrinter'
import { EventSystem } from './systems/EventSystem'

interface GameContext {
  map: MapManager
  world: World
  events: EventSystem
  save: any
  rl: any
}

type CommandFunction = (player: Player, args: string[], context: GameContext) => boolean | string

const mapInput = (cmd: string) => {
  const trimmed = cmd.trim()
  return Object.entries(COMMAND_GROUPS).find(([_, arr]) => arr.includes(trimmed))?.[0] ?? trimmed
}

const parseCommand = (rawCmd: string) => {
  const parts = rawCmd.trim().split(/\s+/)
  const cmd = parts[0]
  const args = parts.slice(1).map((arg) => (arg.startsWith('--') ? arg.slice(2) : arg))
  return { cmd, args }
}

// --- COMMANDS 객체 ---
const COMMANDS: Record<string, CommandFunction> = {
  up: Commands.moveCommand('up'),
  down: Commands.moveCommand('down'),
  left: Commands.moveCommand('left'),
  right: Commands.moveCommand('right'),
  attack: Commands.attackCommand,
  equip: Commands.equipCommand,
  respawn: Commands.respawnCommand,
  exit: Commands.exitCommand,
  pick: Commands.pickCommand,
  help: Commands.helpCommand,
  inventory: Commands.inventoryCommand,
  status: Commands.statusCommand,
  look: Commands.lookCommand,
  clear: Commands.clearCommand,
}

// --- handleCommand ---
export function handleCommand(rawCmd: string, player: Player, context: GameContext) {
  const { cmd: rawCmdCmd, args } = parseCommand(rawCmd)
  const cmd = mapInput(rawCmdCmd)
  const fn = COMMANDS[cmd]

  if (!fn) {
    console.log('알 수 없는 명령입니다.')
    context.rl.prompt()
    return
  }

  const result = fn(player, args, context)

  if (result === 'exit') {
    return // rl.close()는 이미 exitCommand에서 호출됨
  }

  if (result) {
    const { map, world, events } = context
    printStatus(player, map, world)
    events.handle(map.tile(player.pos.x, player.pos.y), player)
  }

  context.save.save({
    player,
    drop: context.world.lootBags, // World에서 드롭 수집
  })
  context.rl.prompt()
}
