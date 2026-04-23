import { BaseNPC } from '~/core/npc/BaseNPC'
import { Terminal } from '~/core'
import i18n from '~/i18n'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { BattleTarget } from '~/types'
import { speak } from '~/utils'
import { BossLogic } from './BossLogic'

export class ThirdBoss implements BossLogic {
  selectedSide = ''

  get postTalk() {
    return i18n.t('npc.third_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: BaseNPC, context: AppContext) {
    const { player, battle, monster, npcs } = context
    await speak(i18n.t('npc.third_boss.encounter.vip_scorn', { returnObjects: true }) as string[])

    let leader: GameNPC
    const kane = npcs.getNPC('kane_leader') as GameNPC

    const isKaneAlive = kane?.isAlive
    const resDemandKey = isKaneAlive
      ? 'npc.third_boss.encounter.res_demand_kane'
      : 'npc.third_boss.encounter.res_demand_ren'

    leader = isKaneAlive ? kane : npcs.getNPC('ren')! as GameNPC

    await speak(i18n.t(resDemandKey, { returnObjects: true }) as string[])

    Terminal.log(i18n.t('npc.third_boss.help_call_vip'))

    if (leader.factionHostility > 0) {
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

    await speak([i18n.t(`npc.third_boss.results.${_res}`)])

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

  async onVictory(bossNpc: BaseNPC, context: AppContext) {
    const { player, npcs, events } = context
    player.removeMercenaries()

    const victoryLines = i18n.t(`npc.third_boss.victory.${this.selectedSide}`, { returnObjects: true }) as string[]

    await speak(victoryLines)

    const kane = npcs.getNPC('kane_leader')

    const isKaneAlive = kane?.isAlive

    if (this.selectedSide === 'resistance') {
      const leaderKey = isKaneAlive ? 'kane' : 'ren'
      const victoryLines = i18n.t(`npc.third_boss.after_victory.resistance.${leaderKey}`, {
        returnObjects: true,
      }) as string[]

      await speak(victoryLines)
    }

    events.completeEvent(`third_boss`)
    events.completeEvent(`third_boss_${this.selectedSide}`)

    const boss = npcs.getNPC('third_boss')
    const kael = npcs.getNPC('kael')
    const vesper = npcs.getNPC('vesper')
    const flint = npcs.getNPC('flint')

    boss && boss.dead({ karma: 0 })

    // 역활이 끝난 레지스탕스 영구 퇴장
    kael && kael.dead({ karma: 0, hostile: 0 })
    vesper && vesper.dead({ karma: 0, hostile: 0 })
    flint && flint.dead({ karma: 0, hostile: 0 })
  }
}
