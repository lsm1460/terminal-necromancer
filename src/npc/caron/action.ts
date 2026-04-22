import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import BossEvent from '~/systems/events/BossEvent'
import { NPC } from '~/types'
import { speak } from '~/utils'
import { CaronService } from './service'

export const CaronActions = {
  /** 1차 대면 */
  async firstEncounter(npc: NPC, context: GameContext) {
    await speak(i18n.t('npc.caron.encounters.first.dialogue', { returnObjects: true }) as string[])
    const answer = await Terminal.confirm(i18n.t('npc.caron.encounters.first.confirm'))

    CaronService.saveAnswer('first', answer)
    await speak([
      answer ? i18n.t('npc.caron.encounters.first.reply_loyal') : i18n.t('npc.caron.encounters.first.reply_ambitious'),
    ])

    Terminal.log(i18n.t('npc.caron.encounters.first.log_disappear'))
    CaronService.relocate(npc, context)
  },

  /** 2차 대면 */
  async secondEncounter(npc: NPC, context: GameContext) {
    await speak(i18n.t('npc.caron.encounters.second.dialogue', { returnObjects: true }) as string[])
    const answer = await Terminal.confirm(i18n.t('npc.caron.encounters.second.confirm'))

    CaronService.saveAnswer('second', answer)
    await speak([i18n.t('npc.caron.encounters.second.reply')])

    Terminal.log(i18n.t('npc.caron.encounters.second.log_ripple'))
    CaronService.relocate(npc, context)
  },

  /** 최종 대면 */
  async finalEncounter(npc: NPC, context: GameContext) {
    const { player, events, map } = context
    const { first, second } = CaronService.getAnswers()

    if (first && !second) {
      await speak(i18n.t('npc.caron.encounters.final.bad_end', { returnObjects: true }) as string[])
      return await this.handleBattle(npc, context)
    }

    // 조건부 대사 가공
    const specificLine = getSpecificLine(first, second)
    const [line1, line2] = i18n.t('npc.caron.encounters.final.last_offer', { returnObjects: true }) as string[]
    await speak([line1, specificLine, line2])

    if (await Terminal.confirm(i18n.t('npc.caron.encounters.final.confirm_offer'))) {
      await speak(i18n.t('npc.caron.encounters.final.accept', { returnObjects: true }) as string[])
      events.completeEvent('caron_is_mine')
      events.completeEvent('defeat_caron')
      npc.dead({ karma: 0 })
      BossEvent.spawnPortal(map.getTile(player.pos))
    } else {
      await speak([i18n.t('npc.caron.encounters.final.refuse')])
      await this.handleBattle(npc, context)
    }
  },

  /** 전투 실행 */
  async handleBattle(npc: NPC, context: GameContext, isManual = false) {
    const { battle, events, map, player, world } = context
    if (isManual) await speak([i18n.t('npc.caron.encounters.battle.manual_start')])

    Terminal.log(i18n.t('npc.caron.encounters.battle.start_log'))
    const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], world)

    if (isWin) {
      await speak(i18n.t('npc.caron.encounters.battle.win_script', { returnObjects: true }) as string[])
      events.completeEvent('caron_is_dead')
      events.completeEvent('defeat_caron')
      BossEvent.spawnPortal(map.getTile(player.pos))
    }
  },

}
function getSpecificLine(first: any, second: any) {
  if (!first && second) return i18n.t('npc.caron.encounters.final.specific_lines.ambitious_rebel')
  if (first && !second) return i18n.t('npc.caron.encounters.final.specific_lines.loyal_but_ambitious')
    
  return i18n.t('npc.caron.encounters.final.specific_lines.obedient_traitor')
}
