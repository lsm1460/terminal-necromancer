import { Terminal, Tile } from '~/core'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { delay } from '~/utils'
import { EventHandler } from '.'

export const b3Handlers: Record<string, EventHandler> = {
  'event-abandoned-corpse': async (tile, context) => {
    if (tile.isClear) return

    const { player, world, monster: monsterFactory } = context
    const candidates = ['shipyard_worker', 'shipyard_hound', 'ratman_scout', 'mutated_worker']
    const randomId = candidates[Math.floor(Math.random() * candidates.length)]
    const monster = monsterFactory.makeMonster(randomId)

    if (!monster) return

    Terminal.log(`\n\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`)
    Terminal.log(i18n.t('events.b3.abandoned_corpse.discovery'))
    Terminal.log(i18n.t('events.b3.abandoned_corpse.found_msg', { name: monster.name }))

    const flavors = i18n.t('events.b3.abandoned_corpse.flavors', { returnObjects: true }) as string[]
    const flavorText = flavors[Math.floor(Math.random() * flavors.length)]

    Terminal.log(`   \x1b[3m"${flavorText}"\x1b[0m`)
    Terminal.log(`\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`)

    world.addCorpse({
      ...monster.getCorpse(),
      ...player.pos,
    })
  },

  'event-voice-recorder': async (tile, context) => {
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

  'event-conveyor-control-1': async (tile, context) => {
    const proceed = await Terminal.confirm(i18n.t('events.b3.conveyor.prompt_1'))

    if (proceed) {
      await transportPlayerByConveyor(
        {
          player: context.player,
          tiles: context.map.currentScene.tiles,
        },
        'event-conveyor-control-2',
        i18n.t('events.b3.conveyor.move_1')
      )
    }
  },

  'event-conveyor-control-2': async (tile, context) => {
    const proceed = await Terminal.confirm(i18n.t('events.b3.conveyor.prompt_2'))

    if (proceed) {
      await transportPlayerByConveyor(
        {
          player: context.player,
          tiles: context.map.currentScene.tiles,
        },
        'event-conveyor-control-1',
        i18n.t('events.b3.conveyor.move_2')
      )
    }
  },
}

const transportPlayerByConveyor = async (
  { player, tiles }: { player: Player; tiles: Tile[][] },
  targetEvent: string,
  message: string
) => {
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
