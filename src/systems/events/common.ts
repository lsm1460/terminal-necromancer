import uniq from 'lodash/uniq'
import { Terminal, Tile } from '~/core'
import i18n from '~/i18n'
import { delay } from '~/utils'
import { EventHandler } from '.'
import BossEvent from './BossEvent'
import { NpcEvent } from './NpcEvent'

export const commonHandlers: Record<string, EventHandler> = {
  heal: (tile, { player }) => {
    player.restoreAll()
  },

  'heal-once': async (tile, { player }) => {
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

  boss: async (tile, context) => {
    await BossEvent.handle(context)
  },

  npc: async (tile, context) => {
    await NpcEvent.handle(tile, context)
  },

  'summon-caron': async (tile, context) => {
    const { events } = context
    const isMine = events.isCompleted('caron_is_mine')
    const isDead = events.isCompleted('caron_is_dead')

    if (!isMine && !isDead) return

    const caronNpcId = isDead ? 'caron_dead' : 'caron_alive'
    tile.npcIds = uniq([...(tile.npcIds || []), caronNpcId])

    if (isDead) {
      Terminal.log(i18n.t('events.caron.whisper_dead'))
    } else {
      Terminal.log(i18n.t('events.caron.whisper_alive'))
    }
  },

  'event-map-scan-once': async (tile, context) => {
    if (tile.isClear) return

    const { map } = context
    const proceed = await Terminal.confirm(i18n.t('events.map_scan.confirm'))

    if (!proceed) return

    Terminal.log(i18n.t('events.map_scan.revealed'))
    await delay(1000)

    const allTiles: Tile[] = []
    let bossTile: Tile

    map.currentScene.tiles.forEach((row) => {
      row.forEach((t) => {
        if (t) {
          allTiles.push(t)
          if (t.event === 'boss') bossTile = t
        }
      })
    })

    if (bossTile!) {
      bossTile.isSeen = true
      Terminal.log(i18n.t('events.map_scan.boss_location'))
      Terminal.log(i18n.t('events.map_scan.boss_flavor'))
      await delay(800)
    }

    const scanCount = Math.floor(Math.random() * 3) + 3
    const unseenTiles = allTiles.filter((t) => !t.isSeen)
    const revealedTiles = unseenTiles.sort(() => 0.5 - Math.random()).slice(0, scanCount)

    revealedTiles.forEach((t) => {
      t.isSeen = true
    })

    Terminal.log(`\x1b[90m...\x1b[0m`)
    Terminal.log(i18n.t('events.map_scan.success', { count: revealedTiles.length }))
    Terminal.log(i18n.t('events.map_scan.fail_flavor'))

    tile.isClear = true
  },
}
