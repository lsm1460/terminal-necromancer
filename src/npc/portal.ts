import enquirer from 'enquirer'
import { Player } from '~/core/Player'
import { GameContext } from '~/types'
import { NPCHandler } from './NPCHandler'
import { printStatus } from '~/statusPrinter'

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

  const { confirm } = await enquirer.prompt<{ confirm: boolean }>({
    type: 'confirm',
    name: 'confirm',
    message: '이 구역의 시작 지점으로 이동하시겠습니까?',
    initial: false,
  })

  if (confirm) {
    const currentScene = map.currentScene

    player.x = currentScene.start_pos.x
    player.y = currentScene.start_pos.y

    console.log(`\n✨ 공간이 일렁이며 ${currentScene.displayName}의 시작 지점으로 이동했습니다.`)

    const tile = map.getTile(player.x, player.y)

    events.handle(tile, player, context)
    broadcast.play()

    printStatus(player, context)
  } else {
    console.log('\n이동을 취소했습니다.')
  }

  return true
}

export default PortalHandler
