import { printPrompt } from '../cli'
import { COMMAND_GROUPS } from '../consts'
import { CommandFunction } from '../types'

// --- Exit ---
export const exitCommand: CommandFunction = (player, args, context) => {
  context.save.save({
    player,
    sceneId: context.map.currentSceneId,
    npcs: context.npcs.getSaveData(),
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
  printPrompt(context)

  return false
}
