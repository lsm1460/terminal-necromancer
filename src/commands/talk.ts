import { Terminal } from '~/core/Terminal'
import npcHandlers from '~/npc'
import { CommandFunction } from '~/types'

export const talkCommand: CommandFunction = async (player, args, context) => {
  const tile = context.map.getTile(player.pos.x, player.pos.y)
  const npcIds = tile?.npcIds || []

  const availableNpcs = npcIds
    .map((id) => context.npcs.getNPC(id))
    .filter((npc) => !!npc)
    .filter((npc) => npc.isAlive)

  if (availableNpcs.length < 1) {
    Terminal.log(`\n[알림] 이곳에는 대화할 상대가 없습니다.`)
    return false
  }

  let selectedNpcId: string | undefined

  // 1. 인자(args)가 있는 경우: 이름으로 직접 찾기
  if (args.length > 0) {
    const targetName = args[0]
    selectedNpcId = npcIds.find((id) => context.npcs.getNPC(id)?.name === targetName)

    if (!selectedNpcId) {
      Terminal.log(`\n[알림] 이곳에 '${targetName}'은(는) 없습니다.`)
      return false
    }
  }
  // 2. 인자가 없는 경우: Terminal 선택창 띄우기
  else {
    const npcId = await Terminal.select('누구와 대화하시겠습니까?', [
      ...availableNpcs.map((npc) => ({
        name: npc.id,
        message: `👤 ${npc.name}`,
      })),
      { name: 'cancel', message: '🔙 돌아가기' },
    ])

    if (npcId === 'cancel') return false
    selectedNpcId = npcId
  }

  const npc = context.npcs.getNPC(selectedNpcId)!
  const handler = npcHandlers[npc.id]

  if (!handler) {
    Terminal.log(`\n[${npc.name}]: "..."`)
    return false
  }

  const dialect = context.npcs.getDialectType(npc.faction === 'resistance' ? npc.factionHostility : npc.relation * -1)

  // 2. 대화 인터페이스 출력
  Terminal.log(`\n──────────────────────────────────────────────────`)
  Terminal.log(`  👤 [${npc.name}] - ${npc.description}`)
  Terminal.log(`  💬 "${npc.scripts?.[dialect]?.greeting || '...'}"`)
  Terminal.log(`──────────────────────────────────────────────────`)

  npc.relation = npc.relation + 1

  try {
    const printFarewell = () => Terminal.log(`\n[${npc.name}]: "${npc.scripts?.[dialect]?.farewell || '...'}"`)

    // 유저가 'exit'를 선택할 때까지 무한 반복
    while (true) {
      const menuChoices = [...handler.getChoices(player, npc, context), { name: 'exit', message: '🏃 떠나기' }]
      const action = await Terminal.select('무엇을 하시겠습니까?', menuChoices)

      // 1. 종료 조건 체크
      if (action === 'exit') {
        printFarewell()
        break // 루프 탈출 -> 대화 종료
      }

      const isEscape = await handler.handle(action, player, npc, context)

      if (isEscape) {
        break // 루프 탈출 -> 대화 종료
      }
    }
  } catch (e) {
  } finally {
    process.stdin.resume()
  }

  return false
}
