import _ from 'lodash'
import enquirer from 'enquirer'
import { GameContext, Tile } from '../../types'
import { CombatUnit } from '../../core/battle/CombatUnit'
import { Player } from '../../core/Player'
import { BossFactory } from './boss/BossFactory'

class BossEvent {
  static async handle(tile: Tile, player: Player, context: GameContext) {
    const { npcs, events, battle, monster } = context

    // 1. 타일 정보에서 보스 NPC 아이디 추출
    const bossId = tile.npcIds?.[0]
    if (!bossId) return

    const bossNpc = npcs.getNPC(bossId)
    
    // 이미 클리어했거나 보스가 죽은 상태라면 포탈 생성 후 종료
    if (events.isCompleted(bossId) || !bossNpc || !bossNpc.isAlive) {
      this.spawnPortal(tile)
      return
    }

    // 2. 보스 메타데이터 및 전용 로직(패턴/생성) 가져오기
    const eventData = events.getEventInfo(bossId)
    const bossLogic = BossFactory.getLogic(bossId)

    // 3. 전투 전 인카운터 연출 및 대화
    this.printEncounterHeader(bossNpc.name)
    await this.playDialogues(eventData?.postTalk || ['...네놈이 죽을 자리를 찾아왔구나.'])

    // 4. 적 유닛 구성 (보스 클래스에 위임)
    console.log(`\n⚔️  전투가 시작됩니다!`)

    let enemies: CombatUnit[] = []
    if (bossLogic) {
      // 보스별 특화된 적 구성 로직 실행
      enemies = bossLogic.createEnemies(bossNpc, eventData, context)
    } else {
      // 전용 클래스가 없는 경우 기본 생성 로직 (Fall-back)
      enemies = [battle.toCombatUnit(bossNpc, 'npc')]
      if (eventData.withMonster) {
        const additional = monster.makeMonsters(eventData.withMonster).map((m) => battle.toCombatUnit(m, 'monster'))
        enemies.push(...additional)
      }
    }

    // 5. 전투 실행 (전투 루프에 bossLogic을 전달하여 패턴 실행 지원)
    const isWin = await battle.runCombatLoop(enemies, context)

    tile.isClear = isWin

    // 6. 승리 시 이벤트 처리
    if (isWin) {
      bossNpc.hp = 0
      bossNpc.isAlive = false
      
      events.completeEvent(bossId)
      console.log(`\n🏆 위협적인 적, ${bossNpc.name}를 처치했습니다!`)

      // 차원문 생성
      this.spawnPortal(tile)

      // 보스별 고유 승리 보상/이벤트 처리 (예: 전용 클래스 해금)
      if (bossLogic?.onVictory) {
        await bossLogic.onVictory(player, context)
      }

      // 전투 후 마무리 대화
      if (eventData?.defeatTalk) {
        await this.playDialogues(eventData.defeatTalk)
      }
    }
  }

  /**
   * 보스 등장 헤더 출력
   */
  private static printEncounterHeader(name: string) {
    console.log(`\n━━━━━━━━━━━━━━━ BOSS ENCOUNTER ━━━━━━━━━━━━━━━`)
    console.log(`   [ ${name} ] 이(가) 앞을 가로막습니다.`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * 순차적 대화 노출 (사용자가 Enter를 칠 때마다 다음 문장)
   */
  private static async playDialogues(messages: string[]) {
    for (const message of messages) {
      await enquirer.prompt({
        type: 'input',
        name: 'confirm',
        message,
        result: () => '',
        format: () => ' (Enter ⏎)',
      })
    }
  }

  /**
   * 클리어 후 차원문 타일 추가
   */
  private static spawnPortal(tile: Tile) {
    tile.npcIds = _.uniq([...(tile.npcIds || []), 'portal'])
    console.log('\n✨ [알림] 정적이 흐르는 방 한가운데에 시작 지점으로 연결되는 [차원문]이 일렁입니다.')
  }
}

export default BossEvent
