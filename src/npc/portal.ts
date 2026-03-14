import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import { printStatus } from '~/statusPrinter'
import { GameContext } from '~/types'
import { NPCHandler } from './NPCHandler'
import i18n from '~/i18n'

const PortalHandler: NPCHandler = {
  getChoices() {
    return [{ name: 'portal', message: i18n.t('npc.portal.choices.move') }]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'portal':
        return await handlePortal(player, context)
      default:
        break
    }
  },
}

async function handlePortal(player: Player, context: GameContext) {
  const { map, events, broadcast } = context

  const confirm = await Terminal.confirm(i18n.t('npc.portal.confirm'))

  if (confirm) {
    const currentScene = map.currentScene

    player.x = currentScene.start_pos.x
    player.y = currentScene.start_pos.y

    Terminal.log(i18n.t('npc.portal.success', { location: i18n.t(`scene.${currentScene.id}`) }))

    const tile = map.getTile(player.x, player.y)

    events.handle(tile, player, context)
    broadcast.play()

    printStatus(player, context)
  } else {
    Terminal.log(i18n.t('npc.portal.cancel'))
  }

  return true
}

export default PortalHandler
