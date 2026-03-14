import { NPCManager } from '~/core/NpcManager'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import npcHandlers from '~/npc'
import { CommandFunction, GameContext, NPC } from '~/types'

export const talkCommand: CommandFunction = async (player, args, context) => {
  const availableNpcs = getAvailableNpcs(player, context)

  if (availableNpcs.length < 1) {
    Terminal.log(`\n[${i18n.t('common.info')}] ${i18n.t('talk.no_one_here')}`)
    return false
  }

  const targetNpc = await selectTargetNpc(availableNpcs, args)
  if (!targetNpc) return false

  printNpcHeader(targetNpc)

  await startTalkSession(targetNpc, player, context)

  return false
}

function getAvailableNpcs(player: Player, context: GameContext): NPC[] {
  const tile = context.map.getTile(player.pos.x, player.pos.y)
  const npcIds = tile?.npcIds || []
  return npcIds.map((id) => context.npcs.getNPC(id)).filter((npc): npc is NPC => !!npc && npc.isAlive)
}

async function selectTargetNpc(npcs: NPC[], args: string[]): Promise<NPC | null> {
  if (args.length > 0) {
    const targetName = args[0]
    const found = npcs.find((npc) => npc.name === targetName)
    if (!found) {
      Terminal.log(`\n[${i18n.t('common.info')}] ${i18n.t('talk.not_found', { name: targetName })}`)
      return null
    }
    return found
  }

  const choices = [
    ...npcs.map((npc) => ({ name: npc.id, message: `👤 ${npc.name}` })),
    { name: 'cancel', message: i18n.t('cancel') },
  ]

  const selectedId = await Terminal.select(i18n.t('talk.select_npc'), choices)
  if (selectedId === 'cancel') return null

  return npcs.find((n) => n.id === selectedId) || null
}

function printNpcHeader(npc: NPC) {
  const dialect = getDialect(npc)
  const greeting = npc.scripts?.[dialect]?.greeting || '...'

  Terminal.log(`\n──────────────────────────────────────────────────`)
  Terminal.log(`  👤 [${npc.name}] - ${npc.description}`)
  Terminal.log(`  💬 "${greeting}"`)
  Terminal.log(`──────────────────────────────────────────────────`)

  npc.relation += 1 // 대화 시 호감도 소폭 상승
}

async function startTalkSession(npc: NPC, player: Player, context: GameContext) {
  const handler = npcHandlers[npc.id]
  if (!handler) {
    Terminal.log(`\n[${npc.name}]: "..."`)
    return
  }

  const dialect = getDialect(npc)

  try {
    while (true) {
      const menuChoices = [
        ...handler.getChoices(player, npc, context),
        { name: 'exit', message: `🏃 ${i18n.t('talk.leave')}` },
      ]

      const action = await Terminal.select(i18n.t('talk.what_to_do'), menuChoices)

      if (action === 'exit') {
        const farewell = npc.scripts?.[dialect]?.farewell || '...'
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

function getDialect(npc: NPC) {
  return NPCManager.getDialectType(npc.faction === 'resistance' ? npc.factionHostility : npc.relation * -1)
}
