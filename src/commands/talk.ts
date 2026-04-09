import { BaseNPC } from '~/core/npc/BaseNPC'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction, GameContext, NPC } from '~/types'

export const talkCommand: CommandFunction = async (...params) => {
  const [player, args, context] = params
  let targetNpc = await selectTargetNpc(...params)
  if (!targetNpc) return false

  printNpcHeader(targetNpc)

  await startTalkSession(targetNpc, player, context)

  return false
}

async function selectTargetNpc(player: Player, args: string[], context: GameContext): Promise<BaseNPC | null> {
  const npcs = context.npcs.getAliveNPCInTile()

  if (npcs.length < 1) {
    Terminal.log(`\n${i18n.t('talk.no_one_here')}`)
    return null
  }

  if (args.length > 0) {
    const targetName = args[0]
    const found = npcs.find((npc) => npc.name === targetName)
    if (!found) {
      Terminal.log(`\n${i18n.t('talk.not_found', { name: targetName })}`)
      return null
    }
    return found
  }

  const choices = [
    ...npcs.map((npc) => {
      const hasQuest = npc.hasQuest(player, context)

      return { name: npc.id, message: `👤${hasQuest ? ' \x1b[32m[!]\x1b[0m' : ''} ${npc.name}` }
    }),
    { name: 'cancel', message: i18n.t('cancel') },
  ]

  const selectedId = await Terminal.select(i18n.t('talk.select_npc'), choices)
  if (selectedId === 'cancel') return null

  return npcs.find((n) => n.id === selectedId) || null
}

function printNpcHeader(npc: NPC) {
  const greeting = npc.getScripts('greeting')

  Terminal.log(`\n──────────────────────────────────────────────────`)
  Terminal.log(`  👤 [${npc.name}] - ${npc.description}`)
  Terminal.log(`  💬 "${greeting}"`)
  Terminal.log(`──────────────────────────────────────────────────`)
}

async function startTalkSession(npc: BaseNPC, player: Player, context: GameContext) {
  npc.relation += 1 // 대화 시 호감도 소폭 상승

  try {
    while (true) {
      const menuChoices = [
        ...npc.getChoices(player, context),
        { name: 'exit', message: `🏃 ${i18n.t('talk.leave')}` },
      ]

      const action = await Terminal.select(i18n.t('talk.what_to_do'), menuChoices)

      if (action === 'exit') {
        const farewell = npc.getScripts('farewell')
        Terminal.log(`\n[${npc.name}]: "${farewell}"`)
        break
      }

      const isEscape = await npc.handle(action, player, context)
      if (isEscape) break
    }
  } catch (e) {
    // 세션 오류 처리
  }
}
