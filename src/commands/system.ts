import { COMMAND_GROUPS } from "../consts"
import { CommandFunction } from "../types"

// --- Respawn ---
export const respawnCommand: CommandFunction = (player, args, context) => {
  if (player.hp < 1) {
    player.move(0, 0)
    return true
  }
  console.log('산 자는 할 수 없다.')
  return false
}

// --- Exit ---
export const exitCommand: CommandFunction = (player, args, context) => {
  context.save.save({
    player,
    drop: context.world.lootBags, // World에서 모든 드롭 수집
  })

  context.rl.close()

  return 'exit'
}

export const helpCommand: CommandFunction = (player, args, context) => {
  console.log('사용 가능한 명령어:')

  for (const [command, aliases] of Object.entries(COMMAND_GROUPS)) {
    console.log(`- ${command}: ${aliases.join(', ')}`)
  }

  return false
}

export const clearCommand: CommandFunction = (player, args, context) => {
  console.clear()
  context.rl.prompt()
  
  return false
}