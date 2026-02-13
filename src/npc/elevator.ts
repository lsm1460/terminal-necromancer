import enquirer from 'enquirer'
import { MAP_IDS, MapId } from '../consts'
import { Player } from '../core/Player'
import { printTileStatus } from '../statusPrinter'
import { GameContext } from '../types'
import { NPCHandler } from './NPCHandler'

const ElevatorHandler: NPCHandler = {
  getChoices() {
    return [{ name: 'elevate', message: '💬 층 간 이동' }]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'elevate':
        return await handleElevate(player, context)
      default:
        break
    }
  },
}

async function handleElevate(player: Player, context: GameContext) {
  const { map, events, world, broadcast } = context
  const completed = events.getCompleted()
  const currentSceneId = map.currentSceneId

  const choices: {
    name: string
    message: string
  }[] = Object.entries(MAP_IDS)
    .filter(([_, value]) => value !== currentSceneId) // 현재 있는 층은 목록에서 제외
    .filter(([_, value]) => value !== MAP_IDS.title) // 현재 있는 층은 목록에서 제외
    .filter(([_, value]) => map.isUnlocked(value, completed))
    .map(([_, value]) => {
      const mapData = map.getMap(value)

      return {
        name: value,
        message: `🛗 ${mapData.displayName}`,
      }
    })

  if (choices.length < 1) {
    console.log('❌ 엘리베이터 사용이 허락되지 않는 망자입니다..')
    return true
  }

  choices.push({ name: 'cancel', message: '🔙 그대로 머물기' })

  const { sceneId } = await enquirer.prompt<{ sceneId: string }>({
    type: 'select',
    name: 'sceneId',
    message: '어느 층으로 이동하시겠습니까?',
    choices: choices,
    format(value) {
      const selected = choices.find((c) => c.name === value)
      return selected ? selected.message : value
    },
  })

  if (sceneId === 'cancel') {
    return true
  }

  // (또는 현재 층이 b1이 아닌 상태에서 다른 곳으로 떠나려 할 때)
  let enterMessage = ''
  if (currentSceneId !== MAP_IDS.B1_SUBWAY) {
    enterMessage = '⚠️ 이 구역을 벗어나면 지형이 변합니다. 정말 이동하시겠습니까?'
  } else {
    enterMessage = '⚠️ 안전구역을 벗어납니다. 정말 이동하시겠습니까?'
  }

  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed', // 반환 객체의 키값이 됩니다.
    message: enterMessage,
    initial: false, // 기본 선택값 (default 대신 initial 사용)
  })

  if (!proceed) {
    console.log('❌ 이동을 취소했습니다.')
    return true
  }

  const targetMapData = map.getMap(sceneId)

  if (targetMapData) {
    console.log(`\n⚙️ 엘리베이터가 작동합니다. 웅성거리는 기계음과 함께 층이 바뀝니다...`)

    // 맵 시스템의 changeScene을 호출하여 플레이어 이동 및 맵 데이터 갱신
    world.clearFloor()
    await map.changeScene(sceneId as MapId, player)

    console.log(`✨ [도착] ${targetMapData.displayName}에 도착했습니다.\n`)

    const tile = map.getTile(player.x, player.y)
    tile.isSeen = true

    events.handle(tile, player, context)
    broadcast.play()

    printTileStatus(player, context)
    return true
  } else {
    console.error(`\n❌ 오류: ${sceneId} 데이터를 찾을 수 없습니다.`)
  }
}

export default ElevatorHandler
