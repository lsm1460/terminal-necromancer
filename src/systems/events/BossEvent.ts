import enquirer from 'enquirer'
import { Battle } from '../../core/Battle'
import { Player } from '../../core/Player'
import { GameContext, Tile } from '../../types'

export class BossEvent {
  static async handle(tile: Tile, player: Player, context: GameContext) {
    const { npcs, events } = context

    // 1. 타일 정보에서 보스 NPC 아이디 추출
    const bossId = tile.npcIds?.[0]
    if (!bossId) return
    
    if (events.isCompleted(bossId)) return

    const bossNpc = npcs.getNPC(bossId)
    if (!bossNpc || !bossNpc.isAlive) return

    // 2. context.events를 통해 events.json의 보스 메타데이터 가져오기
    // events.getEventInfo(id) 같은 메서드가 있다고 가정하거나 직접 데이터에 접근합니다.
    const eventData = events.getEventInfo(bossId)
    const dialogues = eventData?.postTalk || ['...네놈이 죽을 자리를 찾아왔구나.']

    console.log(`\n━━━━━━━━━━━━━━━ BOSS ENCOUNTER ━━━━━━━━━━━━━━━`)
    console.log(`   [ ${bossNpc.name} ] 이(가) 앞을 가로막습니다.`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // 3. 순차적 대화 노출 (사용자가 키를 누를 때마다 다음 문장)
    for (const text of dialogues) {
      await enquirer.prompt({
        type: 'input',
        name: 'confirm',
        message: `[${bossNpc.name}]: "${text}"`,
        // 입력값은 필요 없고 진행을 위한 대기 용도
        result: () => '',
        format: () => ' (계속하려면 Enter)',
      })
    }

    console.log(`\n⚔️  전투가 시작됩니다!`)

    // 4. 전투 실행
    // bossNpc가 Hostile NPC라면 그대로 전달합니다.
    await Battle.runCombatLoop(player, [bossNpc as any], context)

    // 5. 승리 시 이벤트 처리
    if (!bossNpc.isAlive) {
      events.completeEvent(bossId)
      console.log(`\n🏆 위협적인 적, ${bossNpc.name}를 처치했습니다!`)
    }
  }
}
