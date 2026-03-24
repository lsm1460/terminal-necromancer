import { NPCManager } from '~/core/NpcManager'
import { Player } from '~/core/player/Player'
import { QuestManager } from '~/core/QuestManager'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import npcHandlers from '~/npc'
import { BattleTarget, CommandFunction, GameContext, NPC } from '~/types'

export const talkCommand: CommandFunction = async (...params) => {
  const [player, args, context] = params
  let targetNpc = await selectTargetNpc(...params)
  if (!targetNpc) return false

  if (player.knight && targetNpc.id === '_knight') targetNpc = player.knight as BattleTarget as NPC

  printNpcHeader(targetNpc)

  await startTalkSession(targetNpc, player, context)

  return false
}

function getAvailableNpcs(player: Player, context: GameContext): NPC[] {
  const tile = context.map.getTile(player.pos.x, player.pos.y)
  const npcIds = [...(tile?.npcIds || [])]

  const list = npcIds.map((id) => context.npcs.getNPC(id)).filter((npc): npc is NPC => !!npc && npc.isAlive)
  if (player.knight) list.push(player.knight as BattleTarget as NPC)

  return list
}

async function selectTargetNpc(player: Player, args: string[], context: GameContext): Promise<NPC | null> {
  const npcs = getAvailableNpcs(player, context)

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
      const hasQuest = QuestManager.hasQuest(player, npc.id, context)

      return { name: npc.id, message: `👤${hasQuest? ' \x1b[32m[!]\x1b[0m' : ''} ${npc.name}` }
    }),
    { name: 'cancel', message: i18n.t('cancel') },
  ]

  const selectedId = await Terminal.select(i18n.t('talk.select_npc'), choices)
  if (selectedId === 'cancel') return null

  return npcs.find((n) => n.id === selectedId) || null
}

function printNpcHeader(npc: NPC) {
  const greeting = NPCManager.getNpcScripts(npc, 'greeting')

  Terminal.log(`\n──────────────────────────────────────────────────`)
  Terminal.log(`  👤 [${npc.name}] - ${npc.description}`)
  Terminal.log(`  💬 "${greeting}"`)
  Terminal.log(`──────────────────────────────────────────────────`)
}

async function startTalkSession(npc: NPC, player: Player, context: GameContext) {
  npc.relation += 1 // 대화 시 호감도 소폭 상승

  const handler = npcHandlers[npc.id]
  if (!handler) {
    Terminal.log(`\n[${npc.name}]: "..."`)
    return
  }

  try {
    while (true) {
      const menuChoices = [
        ...handler.getChoices(player, npc, context),
        { name: 'exit', message: `🏃 ${i18n.t('talk.leave')}` },
      ]

      const action = await Terminal.select(i18n.t('talk.what_to_do'), menuChoices)

      if (action === 'exit') {
        const farewell = NPCManager.getNpcScripts(npc, 'farewell')
        Terminal.log(`\n[${npc.name}]: "${farewell}"`)
        break
      }

      const isEscape = await handler.handle(action, player, npc, context)
      if (isEscape) break
    }
  } catch (e) {
    // 세션 오류 처리
  }
}
