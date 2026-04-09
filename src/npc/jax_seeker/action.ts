import { MAP_IDS } from '~/consts'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'

export const JaxActions = {
  /** 기지 입장 처리 */
  async handleEnter(context: GameContext) {
    Terminal.log(i18n.t('npc.jax_seeker.enter.log'))
    await context.map.changeScene(MAP_IDS.B3_5_RESISTANCE_BASE, context)
  },

  /** 가입 이벤트 분기 처리 */
  async handleJoin(npc: NPC, context: GameContext) {
    const { map, events, battle, player } = context
    const tile = map.getTile(player.pos)

    const dialogues = i18n.t('npc.jax_seeker.join.dialogues', { returnObjects: true }) as string[]
    await speak(dialogues)

    const choice = await Terminal.select(i18n.t('npc.jax_seeker.join.select_title'), [
      { message: i18n.t('npc.jax_seeker.join.options.join'), name: 'join' },
      { message: i18n.t('npc.jax_seeker.join.options.kill'), name: 'kill' },
      { message: i18n.t('npc.jax_seeker.join.options.leave'), name: 'leave' },
    ])

    if (choice === 'join') {
      Terminal.log(i18n.t('npc.jax_seeker.join.result_join'))
      events.completeEvent('RESISTANCE_BASE')
      if (await Terminal.confirm(i18n.t('npc.jax_seeker.join.confirm_move'))) {
        await this.handleEnter(context)
      } else {
        Terminal.log(i18n.t('npc.jax_seeker.join.stay_msg'))
      }
    } 
    else if (choice === 'kill') {
      Terminal.log(i18n.t('npc.jax_seeker.join.result_kill_jax'))
      Terminal.log(i18n.t('npc.jax_seeker.join.result_kill_player'))
      const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], context)
      
      if (isWin) {
        events.completeEvent('RESISTANCE_BASE')
        npc.updateHostility(40)
      } else {
        npc.updateHostility(10)
      }
      tile.isClear = true
    } 
    else {
      Terminal.log(i18n.t('npc.jax_seeker.join.result_leave'))
    }
    
    return true
  }
}