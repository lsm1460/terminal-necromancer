import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { printTileStatus } from '~/statusPrinter'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { handleTalk, NPCHandler } from './NPCHandler'

const OliverHandler: NPCHandler = {
  getChoices(player, npc, context) {
    const alreadyTalk = context.events.isCompleted('b5_oliver')

    if (alreadyTalk) {
      return [{ name: 'talk', message: i18n.t('talk.small_talk') }]
    } else {
      return [{ name: 'event', message: i18n.t('talk.examine') }]
    }
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        handleTalk(npc)
        break
      case 'event':
        await handleEvent(npc, player, context)
        break
      default:
        break
    }
  },
}

async function handleEvent(npc: NPC, player: Player, context: GameContext) {
  const { events, world } = context
  const dialogues = i18n.t('npc.oliver.last_words', { returnObjects: true }) as string[]
  await speak(dialogues)

  events.completeEvent('b5_oliver')
  npc.dead({karma: 0})

  world.addCorpse({
    ...npc,
    ...player.pos,
  })

  printTileStatus(player, context)
}

export default OliverHandler
