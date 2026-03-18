import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import BossEvent from '~/systems/events/BossEvent'
import { GameContext, NPC, Tile } from '~/types'
import { speak } from '~/utils'
import { NPCHandler } from './NPCHandler'

let count = 0
let firstAnswer: boolean | null = null
let secondAnswer: boolean | null = null

const CaronHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'talk', message: i18n.t('talk.speak') },
      { name: 'battle', message: '💀 청소 (전투)' },
    ]
  },

  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        await handleCaronEvent(player, npc, context)
        break
      case 'battle':
        await handleBattle(player, npc, context, true)
        break
    }

    return true
  },
}

export function relocateCaron(player: Player, npc: NPC, context: GameContext) {
  const { map } = context
  const tiles: (Tile | null)[][] = map.currentScene.tiles

  // 1. 현재 타일 이벤트 제거
  const currentTile = map.getTile(player.pos.x, player.pos.y)
  if (currentTile) {
    currentTile.event = 'none'
  }

  // 2. 전체 타일 관찰 메시지 초기화
  tiles.forEach((row) => {
    row?.forEach((tile) => {
      if (tile) {
        tile.npcIds = _.without(tile.npcIds, 'caron')
        tile.observe = i18n.t('npc.caron.relocate.default_observe')
      }
    })
  })

  // 3. 새 후보지 추출
  const candidateTiles: { x: number; y: number; tile: Tile }[] = []
  tiles.forEach((row, y) => {
    row?.forEach((tile, x) => {
      if (tile && tile.event === 'event-caron') {
        candidateTiles.push({ x, y, tile })
      }
    })
  })

  // 4. 랜덤 이동 및 힌트 설정
  const target = _.sample(candidateTiles)
  if (target) {
    const { x, y, tile } = target
    if (!tile.npcIds) tile.npcIds = []
    tile.npcIds.push(npc.id)

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ]

    directions.forEach((dir) => {
      const ny = y + dir.dy
      const nx = x + dir.dx
      const neighbor = tiles[ny]?.[nx]
      if (neighbor) {
        // 인접 타일에 카론이 근처에 있다는 힌트 설정
        neighbor.observe = i18n.t('npc.caron.relocate.proximity_hint')
      }
    })
  }
}

async function handleCaronEvent(player: Player, npc: NPC, context: GameContext) {
  if (count === 0) {
    await firstEncounter()
    relocateCaron(player, npc, context)
    count++
  } else if (count === 1) {
    await secondEncounter()
    relocateCaron(player, npc, context)
    count++
  } else await finalEncounter(player, npc, context)
}

/** 1차 대면: 시스템에 대한 순응도 확인 */
async function firstEncounter() {
  await speak(i18n.t('npc.caron.encounters.first.dialogue', { returnObjects: true }) as string[])

  const answer = await Terminal.confirm(i18n.t('npc.caron.encounters.first.confirm'))

  firstAnswer = answer

  await speak([
    answer ? i18n.t('npc.caron.encounters.first.reply_loyal') : i18n.t('npc.caron.encounters.first.reply_ambitious'),
  ])

  Terminal.log(i18n.t('npc.caron.encounters.first.log_disappear'))
}

/** 2차 대면: 시스템에 대한 분노와 복수심 확인 */
async function secondEncounter() {
  await speak(i18n.t('npc.caron.encounters.second.dialogue', { returnObjects: true }) as string[])

  const answer = await Terminal.confirm(i18n.t('npc.caron.encounters.second.confirm'))

  secondAnswer = answer

  await speak([i18n.t('npc.caron.encounters.second.reply')])

  Terminal.log(i18n.t('npc.caron.encounters.second.log_ripple'))
}

/** 최종 대면: 답변 판단 및 최종 결판 */
async function finalEncounter(player: Player, npc: NPC, context: GameContext) {
  const { events, map } = context

  // 1. 최악의 조합: 야심도 없고 반역 의사도 없는 경우
  if (firstAnswer && !secondAnswer) {
    await speak(i18n.t('npc.caron.encounters.final.bad_end', { returnObjects: true }) as string[])
    await handleBattle(player, npc, context)
    return
  }

  // 2. 대화가 통하는 조합 (최종 제안 진행)
  let specificLine = ''
  if (!firstAnswer && secondAnswer) {
    specificLine = i18n.t('npc.caron.encounters.final.specific_lines.ambitious_rebel')
  } else if (firstAnswer && !secondAnswer) {
    specificLine = i18n.t('npc.caron.encounters.final.specific_lines.loyal_but_ambitious')
  } else if (!firstAnswer && secondAnswer) {
    specificLine = i18n.t('npc.caron.encounters.final.specific_lines.obedient_traitor')
  }

  const lastOfferLines = i18n.t('npc.caron.encounters.final.last_offer', { returnObjects: true }) as string[]

  await speak([lastOfferLines[0], specificLine, lastOfferLines[1]])

  const choice = await Terminal.confirm(i18n.t('npc.caron.encounters.final.confirm_offer'))

  if (choice) {
    // 협력 루트 (카론 생존 및 기만)
    await speak(i18n.t('npc.caron.encounters.final.accept', { returnObjects: true }) as string[])

    events.completeEvent('caron_is_mine')
    events.completeEvent('defeat_caron')
    npc.dead(0)

    const tile = map.getTile(player.pos.x, player.pos.y)
    BossEvent.spawnPortal(tile)
  } else {
    // 거절 루트 (결국 전투)
    await speak([i18n.t('npc.caron.encounters.final.refuse')])
    await handleBattle(player, npc, context)
  }
}

/** 전투 핸들러 */
async function handleBattle(player: Player, npc: NPC, context: GameContext, isManual: boolean = false) {
  const { battle, events, map } = context

  if (isManual) {
    await speak([i18n.t('npc.caron.encounters.battle.manual_start')])
  }

  Terminal.log(i18n.t('npc.caron.encounters.battle.start_log'))
  const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], context)

  if (isWin) {
    // 승리 시 영혼 추출 연출
    await speak(i18n.t('npc.caron.encounters.battle.win_script', { returnObjects: true }) as string[])

    events.completeEvent('caron_is_dead')
    events.completeEvent('defeat_caron')

    const tile = map.getTile(player.pos.x, player.pos.y)
    BossEvent.spawnPortal(tile)
  }
}

export default CaronHandler
