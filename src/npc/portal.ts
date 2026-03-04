import { Logger } from '~/core/Logger'
import { Player } from '~/core/player/Player'
import { printStatus } from '~/statusPrinter'
import { GameContext } from '~/types'
import { NPCHandler } from './NPCHandler'

const PortalHandler: NPCHandler = {
  getChoices() {
    return [{ name: 'portal', message: '💬 시작 점으로 이동' }]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'portal':
        return await handlePortal(player, context)
      default:
        break
    }
  },
}

async function handlePortal(player: Player, context: GameContext) {
  const { map, events, broadcast } = context

  const confirm = await Logger.confirm('이 구역의 시작 지점으로 이동하시겠습니까?')

  if (confirm) {
    const currentScene = map.currentScene

    player.x = currentScene.start_pos.x
    player.y = currentScene.start_pos.y

    Logger.log(`\n✨ 공간이 일렁이며 ${currentScene.displayName}의 시작 지점으로 이동했습니다.`)

    const tile = map.getTile(player.x, player.y)

    events.handle(tile, player, context)
    broadcast.play()

    printStatus(player, context)
  } else {
    Logger.log('\n이동을 취소했습니다.')
  }

  return true
}

export default PortalHandler
