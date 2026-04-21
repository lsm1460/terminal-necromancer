import { printTileStatus } from '~/core/statusPrinter'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, Monster, NPC } from '~/types'
import { GameDrop } from '~/types/item'
import { lookCorpse } from './corpse'
import { lookBattleTarget } from './entity'
import { lookItem } from './item'
import { getTileFromDirection, lookPath } from './path'

export const lookAll = async (context: GameContext, items: GameDrop[], monsters?: Monster[]): Promise<void> => {
  const { player, map, npcs, world } = context
  const aliveMonsters = monsters?.filter((m) => m.isAlive) || []
  const minions = player.minions || []
  const tile = map.getTile(player.pos)

  const aliveNPCs = (tile.npcIds || []).map((id) => npcs.getNPC(id)).filter((npc) => npc?.isAlive) as NPC[]
  const corpse = world.getCorpsesAt(player.pos)

  const directions = ['up', 'down', 'left', 'right']

  const accessiblePaths = directions
    .map((direction) => {
      const tile = getTileFromDirection(player, map, direction)
      if (!tile) {
        return null
      }

      return {
        direction,
        label: i18n.t(direction),
        tile,
      }
    })
    .filter((result): result is NonNullable<typeof result> => Boolean(result && result.tile))

  const categoryChoices = [
    { name: 'CURRENT', message: i18n.t('commands.look.category.current') },
    ...(accessiblePaths.length ? [{ name: 'PATH', message: i18n.t('commands.look.category.path') }] : []),
    ...(aliveNPCs.length ? [{ name: 'NPC', message: i18n.t('commands.look.category.npc') }] : []),
    ...(corpse.length ? [{ name: 'CORPSE', message: i18n.t('commands.look.category.corpse') }] : []),
    ...(aliveMonsters.length ? [{ name: 'MONSTER', message: i18n.t('commands.look.category.monster') }] : []),
    ...(minions.length ? [{ name: 'MINION', message: i18n.t('commands.look.category.minion') }] : []),
    ...(items.length ? [{ name: 'ITEM', message: i18n.t('commands.look.category.item') }] : []),
    { name: 'cancel', message: i18n.t('cancel') },
  ]

  // 1. 카테고리 선택
  const category = await Terminal.select(i18n.t('commands.look.select_prompt'), categoryChoices)

  if (category === 'cancel') return

  let targetId: string
  switch (category) {
    case 'CURRENT':
      targetId = 'current'
      printTileStatus(context)
      break
    case 'MONSTER':
      targetId = await lookBattleTarget(aliveMonsters, context)
      break
    case 'MINION':
      targetId = await lookBattleTarget(minions, context)
      break
    case 'NPC':
      targetId = await lookBattleTarget(aliveNPCs, context)
      break
    case 'ITEM':
      targetId = await lookItem(items, player)
      break
    case 'PATH':
      targetId = await lookPath(accessiblePaths)
      break
    case 'CORPSE':
      targetId = await lookCorpse(corpse)
      break
    default:
      targetId = 'back'
      break
  }

  if (targetId === 'back') return await lookAll(context, items, monsters)
}
