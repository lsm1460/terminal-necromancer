import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { BattleTarget, GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { BossLogic } from './BossLogic'

export class ThirdBoss implements BossLogic {
  selectedSide = ''

  get postTalk() {
    return i18n.t('npc.third_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: NPC, context: GameContext, player: Player) {
    const { battle, monster, npcs } = context

    await speak(i18n.t('npc.third_boss.encounter.vip_scorn', { returnObjects: true }) as string[])

    let leader: NPC
    const kane = npcs.getNPC('kane_leader')

    const isKaneAlive = kane?.isAlive
    const resDemandKey = isKaneAlive
      ? 'npc.third_boss.encounter.res_demand_kane'
      : 'npc.third_boss.encounter.res_demand_ren'

    leader = isKaneAlive ? kane : npcs.getNPC('ren')!

    await speak(i18n.t(resDemandKey, { returnObjects: true }) as string[])

    Terminal.log(i18n.t('npc.third_boss.help_call_vip'))

    if (!leader.isHostile) {
      Terminal.log(i18n.t('npc.third_boss.help_call_res', { name: leader.name }))
    }

    const options = [
      { name: 'vip', message: i18n.t('npc.third_boss.options.vip') },
      { name: 'kill_all', message: i18n.t('npc.third_boss.options.kill_all') },
    ]

    if (!leader.isHostile) {
      options.unshift({ name: 'resistance', message: i18n.t('npc.third_boss.options.resistance') })
    }

    const _res = await Terminal.select(i18n.t('npc.third_boss.select_side'), options)

    this.selectedSide = _res

    await speak([i18n.t('npc.third_boss.results.resistance')])

    if (_res === 'resistance') {
      player.addMercenary(leader)
      // enemy is VIP
      return monster.makeMonsters('monster-b5-vip').map((m) => battle.toCombatUnit(m, 'monster'))
    } else if (_res === 'vip') {
      // enemy is resistance
      const arka = monster.makeMonster('arka')
      player.addMercenary(arka!)

      return [
        leader,
        npcs.getNPC('flint'),
        npcs.getNPC('kael'),
        npcs.getNPC('vesper'),
        ...monster.makeMonsters('monster-b5-resistance'),
      ]
        .filter((n) => n && n.isAlive)
        .slice(0, 6)
        .map((m) => battle.toCombatUnit(m as BattleTarget, 'npc'))
    } else {
      // enemy is all of them
      return [
        leader,
        npcs.getNPC('flint'),
        ...monster.makeMonsters('monster-b5-vip').slice(0, 3),
        ...monster.makeMonsters('monster-b5-resistance').slice(0, 3),
      ]
        .filter((n) => n && n.isAlive)
        .slice(0, 6)
        .map((m) => battle.toCombatUnit(m as BattleTarget, 'npc'))
    }
  }

  async onVictory(player: Player, context: GameContext) {
    const { npcs, events } = context
    const boss = npcs.getNPC('third_boss')

    player.removeMercenaries()

    const victoryLines = i18n.t(`npc.third_boss.victory.${this.selectedSide}`, { returnObjects: true }) as string[]

    await speak(victoryLines)

    events.completeEvent(`third_boss`)
    events.completeEvent(`third_boss_${this.selectedSide}`)

    boss && boss.dead(0)
  }
}
