import { COMMAND_GROUPS } from '~/consts'
import { Logger } from '~/core/Logger'
import { CommandFunction } from '~/types'

// --- Exit ---
export const exitCommand: CommandFunction = (player, args, context) => {
  Logger.log('\n💾 게임 데이터를 저장하는 중...')

  // 1. 현재 상태 저장
  context.save.save({
    player,
    sceneId: context.map.currentSceneId,
    npcs: context.npcs.getSaveData(),
    drop: context.world.lootBags,
    completedEvents: context.events.getSaveData(),
  })

  Logger.log('✅ 저장 완료!')
  Logger.log('👋 게임을 종료합니다. 안녕히 가세요, 네크로맨서님.')

  return 'exit'
}

export const helpCommand: CommandFunction = (player, args, context) => {
  Logger.log('사용 가능한 명령어:')

  for (const [command, aliases] of Object.entries(COMMAND_GROUPS)) {
    Logger.log(`- ${command}: ${aliases.join(', ')}`)
  }

  return false
}

export const clearCommand: CommandFunction = () => {
  console.clear()

  return false
}
