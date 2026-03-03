import enquirer from 'enquirer'
import { Logger } from '~/core/Logger'
import { Player } from '~/core/player/Player'
import { GameContext, Tile } from '~/types'
import { delay } from '~/utils'
import { EventHandler } from '.'

export const b3Handlers: Record<string, EventHandler> = {
  'event-abandoned-corpse': async (tile, player, context) => {
    if (tile.isClear) return

    const { world, battle } = context

    // 1. 등장 가능한 몬스터 목록
    const candidates = ['shipyard_worker', 'shipyard_hound', 'ratman_scout', 'mutated_worker']
    const randomId = candidates[Math.floor(Math.random() * candidates.length)]

    // 2. 몬스터 데이터 생성
    const monster = battle.monster.makeMonster(randomId)

    if (!monster) return

    Logger.log(`\n\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`)
    Logger.log(`🔍 \x1b[1m주변을 조사하던 중 차가운 바닥에서 무언가를 발견했습니다...\x1b[0m`)
    Logger.log(`   [\x1b[31m${monster.name}\x1b[0m]의 시체입니다. 이미 숨이 끊어진 지 오래된 것 같습니다.`)

    const flavorText = [
      '누군가에게 무참히 공격받은 흔적이 남아있습니다.',
      '시체 주변에 정체를 알 수 없는 이질적인 점액이 묻어있습니다.',
      '주머니는 이미 털려있고, 비릿한 피 냄새만이 코를 찌릅니다.',
      '시체는 부자연스럽게 뒤틀려 있어, 공포에 질린 채 죽었음을 짐작게 합니다.',
    ]
    Logger.log(`   \x1b[3m"${flavorText[Math.floor(Math.random() * flavorText.length)]}"\x1b[0m`)
    Logger.log(`\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`)

    world.addCorpse({
      ...monster,
      ...player.pos,
    })
  },

  'event-voice-recorder': async (tile, player, context) => {
    if (tile.isClear) return

    Logger.log(`\n\x1b[90m[ 녹슨 선로 옆에 떨어진 공식 기록 장치를 발견했습니다 ]\x1b[0m`)

    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed',
      message: '📽️ "터미널 관리실 제출용" 음성 기록을 재생하시겠습니까?',
      initial: false,
    })

    if (!proceed) return

    const script = [
      { text: '……치익. 하역 담당 402호, 금일 작업 현황을 보고합니다.', delay: 800 },
      { text: '금일은 연옥행 화물 열차의 증편으로 인해 예정보다 많은 영혼석이 하역되었습니다.', delay: 1000 },
      {
        text: '현재 인부들의 마모가 심각하여 작업 능률이 저하되고 있으나, 관리실의 지침에 따라 할당량은 준수하였습니다.',
        delay: 1200,
      },
      { text: '차후 교대 인력의 원활한 배치를 건의드립니다. 이상입니다.', delay: 1500 },
      { text: '……(치익, 기계적인 잡음이 길게 이어집니다)……', delay: 2000 },
      { text: '……건의드린다고 해서 무언가 바뀐 적이 있었던가요.', delay: 1200 },
      { text: '그분께선 우리가 이곳의 부속품이라는 사실조차 잊으셨을 겁니다.', delay: 1200 },
      { text: '……그보다 레지스탕스 소식은 뭣 좀 들은 거 없으십니까?', delay: 1500 },
      { text: '……치이익.', delay: 1000 },
    ]

    Logger.log(`\n\x1b[90m[ 관리실 시스템에 저장된 음성 로그 재생 중... ]\x1b[0m`)

    for (const line of script) {
      await delay(line.delay)

      // 보고(경어체)는 흰색, 독백은 짙은 회색
      const isReport = script.indexOf(line) < 4
      const color = isReport ? '\x1b[37m' : '\x1b[3m\x1b[90m'

      Logger.log(`  ${color}"${line.text}"\x1b[0m`)
    }

    await delay(1000)
    Logger.log(`\n\x1b[90m[ 기록이 종료되었습니다. ]\x1b[0m`)
  },

  'event-map-scan-once': async (tile, player, context) => {
    if (tile.isClear) return

    const { map } = context

    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed',
      message: '📍 칠이 벗겨진 터미널 하역 안내판을 발견했습니다. 살펴보시겠습니까?',
      initial: false,
    })

    if (!proceed) return

    Logger.log(`\n\x1b[90m[ 쌓인 먼지를 털어내자, 하역장의 복잡한 선로 지도가 드러납니다 ]\x1b[0m`)
    await delay(1000)

    const allTiles: Tile[] = []
    let bossTile: Tile

    map.currentScene.tiles.forEach((row) => {
      row.forEach((t) => {
        if (t) {
          allTiles.push(t)
          if (t.event === 'boss') bossTile = t
        }
      })
    })

    // 1. 중장비(골렘) 가동 구역 표기
    if (bossTile!) {
      bossTile.isSeen = true
      Logger.log(
        `\x1b[33m🔍 '제1 적재소' 위치에 [대형 자동 기중기 가동 중 - 접근 주의]라는 문구가 적혀 있습니다.\x1b[0m`
      )
      Logger.log(`\x1b[90m   (누군가 그 위에 "골렘이 폭주함"이라고 비뚤비뚤하게 덧써놓았습니다.)\x1b[0m`)
      await delay(800)
    }

    // 2. 낡아서 일부만 판독 가능한 랜덤 타일
    const scanCount = Math.floor(Math.random() * 3) + 3 // 3~5개
    const unseenTiles = allTiles.filter((t) => !t.isSeen)

    const revealedTiles = unseenTiles.sort(() => 0.5 - Math.random()).slice(0, scanCount)

    revealedTiles.forEach((t) => {
      t.isSeen = true
    })

    Logger.log(`\x1b[90m...\x1b[0m`)
    Logger.log(`\x1b[32m✅ 훼손되지 않은 ${revealedTiles.length}곳의 구역 정보를 확인했습니다.\x1b[0m`)
    Logger.log(`\x1b[90m(나머지 선로 정보는 녹이 슬어 알아볼 수 없습니다.)\x1b[0m\n`)

    tile.isClear = true
  },

  'event-conveyor-control-1': async (tile, player, context) => {
    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed',
      message: '⚙️ 2번 플랫폼으로 향하는 컨베이어에 몸을 실으시겠습니까?',
      initial: false,
    })

    if (proceed) {
      await transportPlayerByConveyor(
        context,
        player,
        'event-conveyor-control-2',
        '벨트가 비명을 지르며 당신을 2번 플랫폼으로 실어 나릅니다...'
      )
    }
  },

  'event-conveyor-control-2': async (tile, player, context) => {
    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed',
      message: '⚙️ 1번 플랫폼으로 향하는 컨베이어를 작동시키겠습니까?',
      initial: false,
    })

    if (proceed) {
      await transportPlayerByConveyor(
        context,
        player,
        'event-conveyor-control-1',
        '역방향 기어가 맞물리며 1번 플랫폼으로 질주합니다!'
      )
    }
  },
}

/**
 * 컨베이어 벨트를 이용한 위치 이동 공통 로직
 * @param targetEvent 찾고자 하는 목적지 이벤트 명 (예: 'event-conveyor-control-2')
 * @param message 플레이어에게 보여줄 커스텀 메시지
 */
const transportPlayerByConveyor = async (
  context: GameContext,
  player: Player,
  targetEvent: string,
  message: string
) => {
  const { map } = context
  const tiles = map.currentScene.tiles

  let targetX = -1
  let targetY = -1
  let destinationTile: Tile | null = null

  // 1. 목적지 좌표 탐색
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const t = tiles[y][x]
      if (t && t.event === targetEvent) {
        targetX = x
        targetY = y
        destinationTile = t
        break
      }
    }
    if (destinationTile) break
  }

  // 2. 이동 처리
  if (destinationTile && targetX !== -1 && targetY !== -1) {
    Logger.log(`\n\x1b[90m[ ${message} ]\x1b[0m`)
    await delay(1200)

    player.x = targetX
    player.y = targetY
    destinationTile.isSeen = true

    Logger.log(`\x1b[32m✨ 슈우우욱—! 목적지에 안전하게 도착했습니다. [${targetX}, ${targetY}]\x1b[0m\n`)
    return true // 이동 성공
  } else {
    Logger.log(`\n\x1b[31m⚠️  치익... 연결된 하역 경로(${targetEvent})를 찾을 수 없습니다.\x1b[0m\n`)
    return false // 이동 실패
  }
}
