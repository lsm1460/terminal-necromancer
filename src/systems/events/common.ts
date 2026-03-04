import _ from 'lodash'
import { Logger } from '~/core/Logger'
import { delay } from '~/utils'
import { EventHandler } from '.'
import BossEvent from './BossEvent'
import { NpcEvent } from './NpcEvent'

export const commonHandlers: Record<string, EventHandler> = {
  heal: (tile, player) => {
    player.restoreAll() // Player 내부에서 minion까지 회복하도록 구현 권장
  },

  'heal-once': async (tile, player, context) => {
    if (tile.isClear) return

    Logger.log(`\n\x1b[93m[ 철과 먼지뿐인 이곳에서, 기적처럼 푸른 이끼와 작은 꽃이 피어난 구석을 발견했습니다 ]\x1b[0m`)
    Logger.log(`\x1b[90m(사신의 서늘한 기운이 닿지 않는, 누군가 의도적으로 숨겨둔 듯한 따스한 공간입니다)\x1b[0m`)

    const proceed = await Logger.confirm(
      '🌿 생명의 온기가 서린 이 자리에 앉아 쉬시겠습니까? (단 한 번만 허락되는 안식입니다)'
    )

    if (!proceed) {
      Logger.log(' > 당신은 이 소중한 온기를 나중을 위해 아껴두기로 합니다.')
      return
    }

    // 회복 연출: 생명의 기운이 스며드는 느낌
    Logger.log(`\n\x1b[32m[ 발밑의 작은 꽃들이 빛을 내며 당신의 상처와 피로를 어루만집니다... ]\x1b[0m`)
    await delay(2000)

    player.restoreAll()

    Logger.log(`\n✨ 생명의 가호가 온몸에 퍼지며 모든 상태가 완벽하게 복구되었습니다!`)
    Logger.log(`\x1b[90m(기운을 다한 꽃들이 투명하게 흩어지며, 다시 차가운 터미널의 공기가 돌아옵니다.)\x1b[0m\n`)

    // 생명의 기운을 소진했으므로 클리어 처리
    tile.isClear = true
  },

  boss: async (tile, player, context) => {
    await BossEvent.handle(tile, player, context)
  },

  npc: async (tile, player, context) => {
    await NpcEvent.handle(tile, player, context)
  },

  'summon-caron': async (tile, player, context) => {
    const { events } = context
    const isMine = events.isCompleted('caron_is_mine')
    const isDead = events.isCompleted('caron_is_dead')

    if (!isMine && !isDead) return

    // 상황에 맞는 NPC 배치
    const caronNpcId = isMine ? 'caron_alive' : 'caron_dead'
    tile.npcIds = _.uniq([...(tile.npcIds || []), caronNpcId])

    // 타일에 머물 때마다 들리는 은밀한 속삭임
    if (isMine) {
      Logger.log('\n카론: "(그림자 너머에서) 군주여, 이곳입니다. 준비가 필요하십니까?"')
    } else {
      Logger.log('\n[아공간의 인도자]: "...주...인... 명령...을..." (기괴한 냉기가 발치를 감쌉니다.)')
    }
  },
}
