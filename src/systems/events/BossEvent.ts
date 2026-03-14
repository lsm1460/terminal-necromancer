import _ from 'lodash'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { GameContext, Tile } from '~/types'
import { speak } from '~/utils'
import { BossFactory } from './boss/BossFactory'

class BossEvent {
  static async handle(tile: Tile, player: Player, context: GameContext) {
    const { npcs, events, battle } = context

    // 1. 타일 정보에서 보스 NPC 아이디 추출
    const bossId = tile.npcIds?.[0]
    if (!bossId) return

    const bossNpc = npcs.getNPC(bossId)

    // 이미 클리어했거나 보스가 죽은 상태라면 포탈 생성 후 종료
    if (events.isCompleted(bossId) || !bossNpc || !bossNpc.isAlive) {
      this.spawnPortal(tile)
      return
    }

    const bossLogic = BossFactory.getLogic(bossId)

    this.printEncounterHeader(bossNpc.name)
    await speak(bossLogic?.postTalk || ['...네놈이 죽을 자리를 찾아왔구나.'])

    Terminal.log(`\n⚔️  전투가 시작됩니다!`)

    let enemies: CombatUnit[] = []
    if (bossLogic) {
      enemies = bossLogic.createEnemies(bossNpc, context)
    } else {
      enemies = [battle.toCombatUnit(bossNpc, 'npc')]
    }

    const isWin = await battle.runCombatLoop(enemies, context)

    tile.isClear = isWin

    if (isWin) {
      bossNpc.hp = 0
      bossNpc.isAlive = false

      events.completeEvent(bossId)
      Terminal.log(`\n🏆 위협적인 적, ${bossNpc.name}를 처치했습니다!`)

      this.spawnPortal(tile)

      if (bossLogic?.onVictory) {
        await bossLogic.onVictory(player, context)
      }

      // 전투 후 마무리 대화
      if (bossLogic?.defeatTalk) {
        await speak(bossLogic.defeatTalk)
      }
    }
  }

  /**
   * 보스 등장 헤더 출력
   */
  private static printEncounterHeader(name: string) {
    Terminal.log(`\n━━━━━━━━━━━━━━━ BOSS ENCOUNTER ━━━━━━━━━━━━━━━`)
    Terminal.log(`   [ ${name} ] 이(가) 앞을 가로막습니다.`)
    Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * 클리어 후 차원문 타일 추가
   */
  static spawnPortal(tile: Tile) {
    tile.npcIds = _.uniq([...(tile.npcIds || []), 'portal'])
    Terminal.log('\n✨ [알림] 정적이 흐르는 방 한가운데에 시작 지점으로 연결되는 [차원문]이 일렁입니다.')
  }
}

export default BossEvent
