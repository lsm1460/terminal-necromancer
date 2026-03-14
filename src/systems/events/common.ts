import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import { delay } from '~/utils'
import i18n from '~/i18n'
import { EventHandler } from '.'
import BossEvent from './BossEvent'
import { NpcEvent } from './NpcEvent'

export const commonHandlers: Record<string, EventHandler> = {
  heal: (tile, player) => {
    player.restoreAll()
  },

  'heal-once': async (tile, player, context) => {
    if (tile.isClear) return

    Terminal.log(i18n.t('events.heal_once.discovery'))
    Terminal.log(i18n.t('events.heal_once.flavor'))

    const proceed = await Terminal.confirm(i18n.t('events.heal_once.confirm'))

    if (!proceed) {
      Terminal.log(i18n.t('events.heal_once.decline'))
      return
    }

    // 회복 연출
    Terminal.log(i18n.t('events.heal_once.process'))
    await delay(2000)

    player.restoreAll()

    Terminal.log(i18n.t('events.heal_once.success'))
    Terminal.log(i18n.t('events.heal_once.cleanup'))

    tile.isClear = true
  },

  boss: async (tile, player, context) => {
    await BossEvent.handle(tile, player, context)
  },

  npc: async (tile, player, context) => {
    await NpcEvent.handle(tile, player, context)
  },

  'summon-caron': async (tile, player, context) => {
    const { events } = context
    const isMine = events.isCompleted('caron_is_mine')
    const isDead = events.isCompleted('caron_is_dead')

    if (!isMine && !isDead) return

    const caronNpcId = isMine ? 'caron_alive' : 'caron_dead'
    tile.npcIds = _.uniq([...(tile.npcIds || []), caronNpcId])

    if (isMine) {
      Terminal.log(i18n.t('events.caron.whisper_alive'))
    } else {
      Terminal.log(i18n.t('events.caron.whisper_dead'))
    }
  },
}