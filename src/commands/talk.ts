import enquirer from 'enquirer'
import { DeathHandler } from '../npc/death'
import { NPCHandler } from '../npc/NPCHandler'
import { CommandFunction } from '../types'

// 핸들러 등록 관리
const npcHandlers: Record<string, NPCHandler> = {
  death: DeathHandler,
}

export const talkCommand: CommandFunction = async (player, args, context) => {
  const targetName = args[0]
  const tile = context.map.getTile(player.pos.x, player.pos.y)
  const npcId = (tile?.npcIds || []).find((id) => context.npcs.getNPC(id)?.name === targetName)

  if (!npcId) {
    console.log(`\n[알림] 이곳에 '${targetName}'은(는) 없습니다.`)
    return false
  }

  const npc = context.npcs.getNPC(npcId)!
  const handler = npcHandlers[npc.id]

  if (!handler) {
    console.log(`\n[${npc.name}]: "할 말이 없군."`)
    return false
  }

  const menuChoices = handler.getChoices()
  const choiceMap = new Map(menuChoices.map((c) => [c.name, c.message]))

  // 대화 시작 메시지 (루프 밖에서 한 번만 출력)
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(` 💬 [${npc.name}]: "${npc.description}"`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  try {
    // 유저가 'exit'를 선택할 때까지 무한 반복
    while (true) {
      const response = await enquirer.prompt({
        type: 'select',
        name: 'action',
        message: '무엇을 하시겠습니까?',
        choices: menuChoices,
        format: (val) => choiceMap.get(val) || val,
        result: (val) => val,
      })

      const { action } = response as { action: string }

      // 1. 종료 조건 체크
      if (action === 'exit') {
        console.log(`\n[${npc.name}]: "그럼 이만."`)
        break // 루프 탈출 -> 대화 종료
      }

      await handler.handle(action, player, context)
    }
  } catch (e) {
  } finally {
    process.stdin.resume()
  }

  return false
}
