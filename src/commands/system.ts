import { COMMAND_GROUPS } from '../consts'
import { CommandFunction } from '../types'

// --- Exit ---
export const exitCommand: CommandFunction = (player, args, context) => {
  console.log('\n💾 게임 데이터를 저장하는 중...')

  // 1. 현재 상태 저장
  context.save.save({
    player,
    sceneId: context.map.currentSceneId,
    npcs: context.npcs.getSaveData(),
    drop: context.world.lootBags,
  })

  console.log('✅ 저장 완료!')
  console.log('👋 게임을 종료합니다. 안녕히 가세요, 네크로맨서님.')

  return 'exit'
}

export const helpCommand: CommandFunction = (player, args, context) => {
  console.log('사용 가능한 명령어:')

  for (const [command, aliases] of Object.entries(COMMAND_GROUPS)) {
    console.log(`- ${command}: ${aliases.join(', ')}`)
  }

  return false
}

export const clearCommand: CommandFunction = () => {
  console.clear()

  return false
}
