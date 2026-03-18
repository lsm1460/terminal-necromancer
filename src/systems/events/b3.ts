import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameContext, Tile } from '~/types'
import { delay } from '~/utils'
import { EventHandler } from '.'

export const b3Handlers: Record<string, EventHandler> = {
  'event-abandoned-corpse': async (tile, player, context) => {
    if (tile.isClear) return

    const { world, battle } = context
    const candidates = ['shipyard_worker', 'shipyard_hound', 'ratman_scout', 'mutated_worker']
    const randomId = candidates[Math.floor(Math.random() * candidates.length)]
    const monster = battle.monster.makeMonster(randomId)

    if (!monster) return

    Terminal.log(`\n\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`)
    Terminal.log(i18n.t('events.b3.abandoned_corpse.discovery'))
    Terminal.log(i18n.t('events.b3.abandoned_corpse.found_msg', { name: monster.name }))

    const flavors = i18n.t('events.b3.abandoned_corpse.flavors', { returnObjects: true }) as string[]
    const flavorText = flavors[Math.floor(Math.random() * flavors.length)]
    
    Terminal.log(`   \x1b[3m"${flavorText}"\x1b[0m`)
    Terminal.log(`\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`)

    world.addCorpse({
      ...monster,
      ...player.pos,
    })
  },

  'event-voice-recorder': async (tile, player, context) => {
    if (tile.isClear) return

    Terminal.log(i18n.t('events.b3.voice_recorder.found'))
    const proceed = await Terminal.confirm(i18n.t('events.b3.voice_recorder.confirm'))

    if (!proceed) return

    const scriptTexts = i18n.t('events.b3.voice_recorder.script', { returnObjects: true }) as string[]
    const delays = [800, 1000, 1200, 1500, 2000, 1200, 1200, 1500, 1000]

    Terminal.log(i18n.t('events.b3.voice_recorder.playing'))

    for (let i = 0; i < scriptTexts.length; i++) {
      await delay(delays[i] || 1000)

      const isReport = i < 4
      const color = isReport ? '\x1b[37m' : '\x1b[3m\x1b[90m'

      Terminal.log(`  ${color}"${scriptTexts[i]}"\x1b[0m`)
    }

    await delay(1000)
    Terminal.log(i18n.t('events.b3.voice_recorder.ended'))
  },

  'event-map-scan-once': async (tile, player, context) => {
    if (tile.isClear) return

    const { map } = context
    const proceed = await Terminal.confirm(i18n.t('events.b3.map_scan.confirm'))

    if (!proceed) return

    Terminal.log(i18n.t('events.b3.map_scan.revealed'))
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
      Terminal.log(i18n.t('events.b3.map_scan.boss_location'))
      Terminal.log(i18n.t('events.b3.map_scan.boss_flavor'))
      await delay(800)
    }

    const scanCount = Math.floor(Math.random() * 3) + 3
    const unseenTiles = allTiles.filter((t) => !t.isSeen)
    const revealedTiles = unseenTiles.sort(() => 0.5 - Math.random()).slice(0, scanCount)

    revealedTiles.forEach((t) => {
      t.isSeen = true
    })

    Terminal.log(`\x1b[90m...\x1b[0m`)
    Terminal.log(i18n.t('events.b3.map_scan.success', { count: revealedTiles.length }))
    Terminal.log(i18n.t('events.b3.map_scan.fail_flavor'))

    tile.isClear = true
  },

  'event-conveyor-control-1': async (tile, player, context) => {
    const proceed = await Terminal.confirm(i18n.t('events.b3.conveyor.prompt_1'))

    if (proceed) {
      await transportPlayerByConveyor(
        context,
        player,
        'event-conveyor-control-2',
        i18n.t('events.b3.conveyor.move_1')
      )
    }
  },

  'event-conveyor-control-2': async (tile, player, context) => {
    const proceed = await Terminal.confirm(i18n.t('events.b3.conveyor.prompt_2'))

    if (proceed) {
      await transportPlayerByConveyor(
        context,
        player,
        'event-conveyor-control-1',
        i18n.t('events.b3.conveyor.move_2')
      )
    }
  },
}

const transportPlayerByConveyor = async (
  context: GameContext,
  player: Player,
  targetEvent: string,
  message: string
) => {
  const { map } = context
  const tiles = map.currentScene.tiles

  let targetX = -1
  let targetY = -1
  let destinationTile: Tile | null = null

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const t = tiles[y][x]
      if (t && t.event === targetEvent) {
        targetX = x
        targetY = y
        destinationTile = t
        break
      }
    }
    if (destinationTile) break
  }

  if (destinationTile && targetX !== -1 && targetY !== -1) {
    Terminal.log(`\n\x1b[90m[ ${message} ]\x1b[0m`)
    await delay(1200)

    player.x = targetX
    player.y = targetY
    destinationTile.isSeen = true

    Terminal.log(i18n.t('events.b3.conveyor.arrival', { x: targetX, y: targetY }))
    return true
  } else {
    Terminal.log(i18n.t('events.b3.conveyor.error', { target: targetEvent }))
    return false
  }
}